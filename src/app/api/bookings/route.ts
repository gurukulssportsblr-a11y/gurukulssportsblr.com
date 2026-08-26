import { NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { format, addDays, isBefore, isEqual, parseISO } from 'date-fns';

function generateDatesForFrequency(startDateStr: string, frequency: string, endDateStr?: string | null): string[] {
  if (frequency === 'one-time' || !endDateStr) {
    return [startDateStr];
  }

  const startDate = parseISO(startDateStr);
  const endDate = parseISO(endDateStr);
  const dates: string[] = [];

  let current = startDate;
  while (isBefore(current, endDate) || isEqual(current, endDate)) {
    const dayOfWeek = current.getDay(); // 0 is Sunday, 6 is Saturday

    if (frequency === 'daily') {
      dates.push(format(current, 'yyyy-MM-dd'));
    } else if (frequency === 'weekly_weekends') {
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        dates.push(format(current, 'yyyy-MM-dd'));
      }
    } else if (frequency === 'weekly_sameday') {
      if (dayOfWeek === startDate.getDay()) {
        dates.push(format(current, 'yyyy-MM-dd'));
      }
    }

    current = addDays(current, 1);
  }

  return dates.length > 0 ? dates : [startDateStr];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courtId = searchParams.get('courtId');
    const date = searchParams.get('date');

    if (!courtId || !date) {
      return NextResponse.json({ error: 'courtId and date are required' }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      // Return sample dummy occupied slots when offline/unconfigured
      return NextResponse.json({
        bookedSlots: ['06:00 AM', '07:00 AM', '05:00 PM', '06:00 PM', '07:00 PM'],
        isDemoMode: true
      });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('booking_slots')
      .select('slot_time')
      .eq('court_id', courtId)
      .eq('slot_date', date)
      .eq('status', 'booked');

    if (error) {
      console.error('Error fetching booked slots:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const bookedSlots = (data as Array<{ slot_time: string }> || []).map((s) => s.slot_time);
    return NextResponse.json({ bookedSlots, isDemoMode: false });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      courtId,
      customerName,
      customerPhone,
      bookingDate,
      selectedSlots,
      frequency = 'one-time',
      repeatUntil = null,
      pricePerHour = 300,
      totalAmount,
    } = body;

    if (!courtId || !customerName || !customerPhone || !bookingDate || !selectedSlots || selectedSlots.length === 0) {
      return NextResponse.json({ error: 'Missing required booking fields.' }, { status: 400 });
    }

    const bookingDates = generateDatesForFrequency(bookingDate, frequency, repeatUntil);
    const bookingCode = `GS-${Math.floor(100000 + Math.random() * 900000)}`;

    if (!isSupabaseConfigured) {
      // In demo mode without DB credentials configured yet
      return NextResponse.json({
        success: true,
        booking: {
          id: 'demo-booking-id',
          booking_code: bookingCode,
          customer_name: customerName,
          customer_phone: customerPhone,
          booking_date: bookingDate,
          frequency,
          total_hours: selectedSlots.length * bookingDates.length,
          total_amount: totalAmount || selectedSlots.length * pricePerHour * bookingDates.length,
          slots: selectedSlots,
          dates: bookingDates,
        },
        message: 'Demo booking created! Connect Supabase database to persist bookings.'
      });
    }

    const supabase = createServerClient();

    // 1. Check for any existing active slot conflicts across all dates
    const { data: conflictsData, error: checkError } = await supabase
      .from('booking_slots')
      .select('slot_date, slot_time')
      .eq('court_id', courtId)
      .eq('status', 'booked')
      .in('slot_date', bookingDates)
      .in('slot_time', selectedSlots);

    if (checkError) {
      console.error('Error checking slot conflicts:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    const conflicts = conflictsData as Array<{ slot_date: string; slot_time: string }> | null;
    if (conflicts && conflicts.length > 0) {
      const conflictDescriptions = conflicts.map((c) => `${c.slot_date} at ${c.slot_time}`).join(', ');
      return NextResponse.json({
        error: `Some slots are already booked: ${conflictDescriptions}`,
        conflicts
      }, { status: 409 });
    }

    const totalHours = selectedSlots.length * bookingDates.length;
    const finalAmount = totalAmount || totalHours * pricePerHour;

    // 2. Insert main booking record
    const { data: newBookingData, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_code: bookingCode,
        court_id: courtId,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        booking_date: bookingDate,
        frequency: frequency as any,
        repeat_until: repeatUntil || null,
        total_hours: totalHours,
        price_per_hour: pricePerHour,
        total_amount: finalAmount,
        status: 'confirmed'
      })
      .select()
      .single();

    if (bookingError || !newBookingData) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json({ error: bookingError?.message || 'Could not save booking' }, { status: 500 });
    }

    const newBooking = newBookingData as any;

    // 3. Insert individual slots for each date
    const slotInserts: any[] = [];
    for (const date of bookingDates) {
      for (const slot of selectedSlots) {
        slotInserts.push({
          booking_id: newBooking.id,
          court_id: courtId,
          slot_date: date,
          slot_time: slot,
          status: 'booked'
        });
      }
    }

    const { error: slotInsertError } = await supabase
      .from('booking_slots')
      .insert(slotInserts);

    if (slotInsertError) {
      console.error('Error inserting booking slots:', slotInsertError);
      // Clean up the created booking if slot insertion fails
      await supabase.from('bookings').delete().eq('id', newBooking.id);
      return NextResponse.json({ error: 'Failed to reserve slots. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      booking: {
        ...newBooking,
        slots: selectedSlots,
        dates: bookingDates
      }
    });

  } catch (err: any) {
    console.error('Unexpected booking error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
