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

    // 1. Release in in-memory store
    cancelMockBooking(bookingId);

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        message: 'Booking cancelled successfully. Time slots are now available again.',
      });
    }

    const supabase = createServerClient();

    // 2. Find booking UUID if booking code was passed
    let targetId = bookingId;
    const isBookingCode = String(bookingId).startsWith('GS-');
    if (isBookingCode) {
      const { data } = await supabase.from('bookings').select('id').eq('booking_code', bookingId).limit(1);
      if (data && data.length > 0) {
        targetId = data[0].id;
      }
    }

    // 3. Mark booking as cancelled in Supabase
    const { error: bookingErr } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .or(`id.eq.${targetId},booking_code.eq.${bookingId}`);

    if (bookingErr) {
      console.error('Error cancelling booking:', bookingErr);
      return NextResponse.json({ error: bookingErr.message }, { status: 500 });
    }

    // 4. Mark booking slots as cancelled to free up the slot
    const { error: slotErr } = await supabase
      .from('booking_slots')
      .update({ status: 'cancelled' })
      .eq('booking_id', targetId);

    if (slotErr) {
      console.error('Error cancelling booking slots:', slotErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully. Time slots are now free and available again.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
