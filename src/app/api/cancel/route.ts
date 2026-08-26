import { NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    const bookingCode = searchParams.get('code');

    if (!phone && !bookingCode) {
      return NextResponse.json({ error: 'Please provide a phone number or booking code.' }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        bookings: [
          {
            id: 'sample-1',
            booking_code: 'GS-892341',
            customer_name: 'Jeremy',
            customer_phone: phone || '9876543210',
            booking_date: new Date().toISOString().split('T')[0],
            frequency: 'one-time',
            total_hours: 2,
            total_amount: 600,
            status: 'confirmed',
            created_at: new Date().toISOString(),
            court: { name: 'Court 1', surface_type: 'Synthetic' },
            booking_slots: [{ slot_time: '10:00 AM' }, { slot_time: '11:00 AM' }]
          }
        ]
      });
    }

    const supabase = createServerClient();
    let query = supabase
      .from('bookings')
      .select(`
        *,
        court:courts(name, surface_type),
        booking_slots(slot_date, slot_time, status)
      `)
      .order('created_at', { ascending: false });

    if (bookingCode) {
      query = query.eq('booking_code', bookingCode.trim().toUpperCase());
    } else if (phone) {
      // Clean phone string
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      query = query.like('customer_phone', `%${cleanPhone}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bookings: data || [] });
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

    if (!isSupabaseConfigured) {
      return NextResponse.json({ success: true, message: 'Demo booking cancelled successfully' });
    }

    const supabase = createServerClient();

    // 1. Mark booking as cancelled
    const { error: bookingErr } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (bookingErr) {
      return NextResponse.json({ error: bookingErr.message }, { status: 500 });
    }

    // 2. Mark booking slots as cancelled to free up the time slots
    const { error: slotErr } = await supabase
      .from('booking_slots')
      .update({ status: 'cancelled' })
      .eq('booking_id', bookingId);

    if (slotErr) {
      return NextResponse.json({ error: slotErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Booking cancelled successfully. Slots are now free.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
