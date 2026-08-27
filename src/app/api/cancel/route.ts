import { NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

const globalStore = global as unknown as {
  _mockBookings?: any[];
  _mockSlots?: Array<{
    court_id: string;
    court_number: number;
    slot_date: string;
    slot_time: string;
    status: string;
    booking_code: string;
  }>;
};

if (!globalStore._mockBookings) globalStore._mockBookings = [];
if (!globalStore._mockSlots) globalStore._mockSlots = [];

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
    const memBookings = (globalStore._mockBookings || []).filter((b) => {
      if (cleanCode && b.booking_code === cleanCode) return true;
      if (cleanPhone && b.customer_phone.includes(cleanPhone)) return true;
      return false;
    }).map((b) => ({
      ...b,
      court: { name: `Court ${b.court_number || 1}`, surface_type: 'Synthetic' },
      booking_slots: (b.slots || []).map((s: string) => ({ slot_time: s, status: b.status })),
    }));

    if (!isSupabaseConfigured) {
      return NextResponse.json({ bookings: memBookings });
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

    const dbBookings = data || [];
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
    let releasedCode = '';
    if (globalStore._mockBookings) {
      globalStore._mockBookings = globalStore._mockBookings.map((b) => {
        if (b.id === bookingId || b.booking_code === bookingId) {
          releasedCode = b.booking_code;
          return { ...b, status: 'cancelled' };
        }
        return b;
      });
    }

    if (globalStore._mockSlots) {
      globalStore._mockSlots = globalStore._mockSlots.map((s) => {
        if (s.booking_code === releasedCode || s.booking_code === bookingId) {
          return { ...s, status: 'cancelled' };
        }
        return s;
      });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        message: 'Booking cancelled successfully. Time slots are now available again.',
      });
    }

    const supabase = createServerClient();

    // 2. Mark booking as cancelled in Supabase
    const { error: bookingErr } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (bookingErr) {
      console.error('Error cancelling booking:', bookingErr);
      return NextResponse.json({ error: bookingErr.message }, { status: 500 });
    }

    // 3. Mark booking slots as cancelled to free up the unique slot index
    const { error: slotErr } = await supabase
      .from('booking_slots')
      .update({ status: 'cancelled' })
      .eq('booking_id', bookingId);

    if (slotErr) {
      console.error('Error cancelling booking slots:', slotErr);
      return NextResponse.json({ error: slotErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully. Time slots are now free and available again.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
