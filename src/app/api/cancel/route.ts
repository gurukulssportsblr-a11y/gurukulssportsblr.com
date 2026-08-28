export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getMockBookings, cancelMockBooking } from '@/lib/server-store';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    const bookingCode = searchParams.get('code');

    if (!phone && !bookingCode) {
      return NextResponse.json({ error: 'Please provide a phone number or booking code.' }, { status: 400 });
    }

    const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
    const cleanCode = bookingCode ? bookingCode.trim().toUpperCase() : '';

    // Search in-memory store
    const memBookings = getMockBookings().filter((b) => {
      if (cleanCode && b.booking_code.toUpperCase() === cleanCode) return true;
      if (cleanPhone && b.customer_phone.replace(/\D/g, '').includes(cleanPhone)) return true;
      return false;
    }).map((b) => ({
      id: b.id,
      booking_code: b.booking_code,
      customer_name: b.customer_name,
      customer_phone: b.customer_phone,
      booking_date: b.booking_date,
      total_amount: b.total_amount,
      status: b.status,
      court: { name: `Court ${b.court_number || 1}`, surface_type: 'Synthetic' },
      booking_slots: (b.slots || []).map((s: string) => ({ slot_time: s, status: b.status })),
    }));

    if (!isSupabaseConfigured) {
      return NextResponse.json({ bookings: memBookings });
    }

    const supabase = createServerClient();
    
    // Fetch courts map
    const { data: courtsList } = await supabase.from('courts').select('id, court_number, name, surface_type');
    const courtMap = new Map<string, { name: string; surface_type: string }>();
    courtsList?.forEach((c: any) => courtMap.set(c.id, { name: c.name, surface_type: c.surface_type }));

    let query = supabase
      .from('bookings')
      .select(`
        id,
        booking_code,
        court_id,
        customer_name,
        customer_phone,
        booking_date,
        total_hours,
        price_per_hour,
        total_amount,
        status,
        booking_slots (id, slot_date, slot_time, status)
      `)
      .order('created_at', { ascending: false });

    if (cleanCode) {
      query = query.eq('booking_code', cleanCode);
    } else if (cleanPhone) {
      query = query.like('customer_phone', `%${cleanPhone}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase lookup error:', error);
      return NextResponse.json({ bookings: memBookings });
    }

    const dbBookings = (data || []).map((b: any) => {
      const courtInfo = courtMap.get(b.court_id) || { name: 'Court 1', surface_type: 'Synthetic' };
      return {
        ...b,
        court: courtInfo,
      };
    });

    // Combine and deduplicate
    const all = [...dbBookings];
    for (const mb of memBookings) {
      if (!all.find((b) => b.booking_code === mb.booking_code)) {
        all.push(mb);
      }
    }

    return NextResponse.json({ bookings: all });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const cleanId = String(bookingId).trim();

    // 1. Release in in-memory store
    cancelMockBooking(cleanId);

    if (isSupabaseConfigured) {
      const supabase = createServerClient();

      let bookingUUID = cleanId;

      // Check if it is a booking_code (e.g. GS-123456)
      if (cleanId.startsWith('GS-')) {
        const { data } = await supabase.from('bookings').select('id').eq('booking_code', cleanId).limit(1);
        if (data && data.length > 0) {
          bookingUUID = data[0].id;
        }
      } else {
        // Check if cleanId is a slot ID
        const { data: slotData } = await supabase.from('booking_slots').select('booking_id').eq('id', cleanId).limit(1);
        if (slotData && slotData.length > 0 && slotData[0].booking_id) {
          bookingUUID = slotData[0].booking_id;
        }
      }

      // Mark booking as cancelled in Supabase
      await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .or(`id.eq.${bookingUUID},booking_code.eq.${cleanId}`);

      // Mark all associated booking slots as cancelled
      await supabase
        .from('booking_slots')
        .update({ status: 'cancelled' })
        .or(`booking_id.eq.${bookingUUID},id.eq.${cleanId}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully. Time slots are now free and available again.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
