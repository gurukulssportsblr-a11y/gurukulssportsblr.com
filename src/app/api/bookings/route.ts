import { NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { format, addDays, isBefore, isEqual, parseISO } from 'date-fns';
import { isSlotPassed } from '@/lib/constants';

// In-Memory Storage for Development, Preview & Fallback
// Preserved across hot reloads on server
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

function parseCourtNumber(courtIdOrNum: string | number): number {
  if (typeof courtIdOrNum === 'number') return courtIdOrNum;
  const match = String(courtIdOrNum).match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

function generateDatesForFrequency(startDateStr: string, frequency: string, endDateStr?: string | null): string[] {
  if (frequency === 'one-time' || !endDateStr) {
    return [startDateStr];
  }

  const startDate = parseISO(startDateStr);
  const endDate = parseISO(endDateStr);
  const dates: string[] = [];

  let current = startDate;
  while (isBefore(current, endDate) || isEqual(current, endDate)) {
    const dayOfWeek = current.getDay();

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

async function resolveSupabaseCourtId(courtIdOrNum: string | number, supabase: any): Promise<string> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (typeof courtIdOrNum === 'string' && uuidRegex.test(courtIdOrNum)) {
    return courtIdOrNum;
  }

  const courtNum = parseCourtNumber(courtIdOrNum);
  try {
    const { data } = await supabase
      .from('courts')
      .select('id')
      .eq('court_number', courtNum)
      .single();

    if (data?.id) return data.id;
  } catch (err) {
    console.error('Error resolving court UUID:', err);
  }

  return String(courtIdOrNum);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courtId = searchParams.get('courtId');
    const date = searchParams.get('date');

    if (!courtId || !date) {
      return NextResponse.json({ error: 'courtId and date are required' }, { status: 400 });
    }

    const courtNum = parseCourtNumber(courtId);

    // If Supabase is not configured, query in-memory persistent registry
    if (!isSupabaseConfigured) {
      const booked = (globalStore._mockSlots || [])
        .filter(
          (s) =>
            (s.court_number === courtNum || s.court_id === courtId) &&
            s.slot_date === date &&
            s.status === 'booked'
        )
        .map((s) => s.slot_time);

      return NextResponse.json({
        bookedSlots: booked,
        isDemoMode: true,
      });
    }

    const supabase = createServerClient();
    const resolvedCourtId = await resolveSupabaseCourtId(courtId, supabase);

    const { data, error } = await supabase
      .from('booking_slots')
      .select('slot_time')
      .eq('court_id', resolvedCourtId)
      .eq('slot_date', date)
      .eq('status', 'booked');

    if (error) {
      console.error('Error fetching booked slots from Supabase:', error);
      // Fallback to in-memory store if DB query fails
      const fallbackBooked = (globalStore._mockSlots || [])
        .filter((s) => s.court_number === courtNum && s.slot_date === date && s.status === 'booked')
        .map((s) => s.slot_time);

      return NextResponse.json({ bookedSlots: fallbackBooked, isDemoMode: false });
    }

    const dbBookedSlots = (data as Array<{ slot_time: string }> || []).map((s) => s.slot_time);

    // Merge with any in-memory mock slots
    const memorySlots = (globalStore._mockSlots || [])
      .filter((s) => s.court_number === courtNum && s.slot_date === date && s.status === 'booked')
      .map((s) => s.slot_time);

    const allBooked = Array.from(new Set([...dbBookedSlots, ...memorySlots]));

    return NextResponse.json({ bookedSlots: allBooked, isDemoMode: false });
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

    // Validate that the booking date and slots are not in the past
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (bookingDate < todayStr) {
      return NextResponse.json({ error: 'Cannot book courts for past dates.' }, { status: 400 });
    }

    if (bookingDate === todayStr) {
      const hasPassedSlot = selectedSlots.some((slot: string) => isSlotPassed(slot, bookingDate));
      if (hasPassedSlot) {
        return NextResponse.json({ error: 'One or more selected time slots have already passed today.' }, { status: 400 });
      }
    }

    const courtNum = parseCourtNumber(courtId);
    const bookingDates = generateDatesForFrequency(bookingDate, frequency, repeatUntil);
    const bookingCode = `GS-${Math.floor(100000 + Math.random() * 900000)}`;
    const totalHours = selectedSlots.length * bookingDates.length;
    const finalAmount = totalAmount || totalHours * pricePerHour;

    // Check conflict in in-memory store
    const memConflicts = (globalStore._mockSlots || []).filter(
      (s) =>
        s.court_number === courtNum &&
        s.status === 'booked' &&
        bookingDates.includes(s.slot_date) &&
        selectedSlots.includes(s.slot_time)
    );

    if (memConflicts.length > 0) {
      const conflictList = memConflicts.map((c) => `${c.slot_date} at ${c.slot_time}`).join(', ');
      return NextResponse.json(
        { error: `The following slot(s) are already booked: ${conflictList}` },
        { status: 409 }
      );
    }

    // If Supabase is NOT configured, store in persistent in-memory store
    if (!isSupabaseConfigured) {
      const newBooking = {
        id: `mock-${Date.now()}`,
        booking_code: bookingCode,
        court_id: `c${courtNum}`,
        court_number: courtNum,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        booking_date: bookingDate,
        frequency,
        repeat_until: repeatUntil || null,
        total_hours: totalHours,
        price_per_hour: pricePerHour,
        total_amount: finalAmount,
        status: 'confirmed',
        created_at: new Date().toISOString(),
      };

      globalStore._mockBookings?.push(newBooking);

      for (const date of bookingDates) {
        for (const slot of selectedSlots) {
          globalStore._mockSlots?.push({
            court_id: `c${courtNum}`,
            court_number: courtNum,
            slot_date: date,
            slot_time: slot,
            status: 'booked',
            booking_code: bookingCode,
          });
        }
      }

      return NextResponse.json({
        success: true,
        booking: {
          ...newBooking,
          slots: selectedSlots,
          dates: bookingDates,
        },
      });
    }

    const supabase = createServerClient();
    const resolvedCourtId = await resolveSupabaseCourtId(courtId, supabase);

    // 1. Check for any existing active slot conflicts in Supabase
    const { data: conflictsData, error: checkError } = await supabase
      .from('booking_slots')
      .select('slot_date, slot_time')
      .eq('court_id', resolvedCourtId)
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
      return NextResponse.json(
        { error: `The following slot(s) are already booked: ${conflictDescriptions}`, conflicts },
        { status: 409 }
      );
    }

    // 2. Insert main booking record in Supabase
    const { data: newBookingData, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_code: bookingCode,
        court_id: resolvedCourtId,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        booking_date: bookingDate,
        frequency: frequency as any,
        repeat_until: repeatUntil || null,
        total_hours: totalHours,
        price_per_hour: pricePerHour,
        total_amount: finalAmount,
        status: 'confirmed',
      })
      .select()
      .single();

    if (bookingError || !newBookingData) {
      console.error('Error creating booking in Supabase:', bookingError);
      return NextResponse.json({ error: bookingError?.message || 'Could not save booking' }, { status: 500 });
    }

    const newBooking = newBookingData as any;

    // 3. Insert individual slots for each date
    const slotInserts: any[] = [];
    for (const date of bookingDates) {
      for (const slot of selectedSlots) {
        slotInserts.push({
          booking_id: newBooking.id,
          court_id: resolvedCourtId,
          slot_date: date,
          slot_time: slot,
          status: 'booked',
        });
      }
    }

    const { error: slotInsertError } = await supabase.from('booking_slots').insert(slotInserts);

    if (slotInsertError) {
      console.error('Error inserting booking slots:', slotInsertError);
      await supabase.from('bookings').delete().eq('id', newBooking.id);
      return NextResponse.json({ error: 'Failed to reserve slots. Please try again.' }, { status: 500 });
    }

    // Also record in memory for immediate instant sync
    for (const date of bookingDates) {
      for (const slot of selectedSlots) {
        globalStore._mockSlots?.push({
          court_id: resolvedCourtId,
          court_number: courtNum,
          slot_date: date,
          slot_time: slot,
          status: 'booked',
          booking_code: bookingCode,
        });
      }
    }

    return NextResponse.json({
      success: true,
      booking: {
        ...newBooking,
        slots: selectedSlots,
        dates: bookingDates,
      },
    });
  } catch (err: any) {
    console.error('Unexpected booking error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
