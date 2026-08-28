import { NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { isSlotPassed, ALL_TIME_SLOTS, parseSlotToHour } from '@/lib/constants';
import {
  getPricingRules,
  getBlockedSlots,
  calculateSlotPriceFromRules,
  isSlotBlocked,
  getMockSlots,
  addMockSlots,
} from '@/lib/server-store';

function parseCourtNumber(courtIdOrNum: string | number): number {
  if (typeof courtIdOrNum === 'number') return courtIdOrNum;
  const match = String(courtIdOrNum).match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
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
    const allCourts = searchParams.get('allCourts') === 'true';

    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 });
    }

    const courtNum = courtId ? parseCourtNumber(courtId) : 1;
    const [pricingRules, blockedSlotsData] = await Promise.all([
      getPricingRules(),
      getBlockedSlots(date),
    ]);

    // Compute blocked slots for this date
    const blockedSlots: Array<{ court_number: number; slot_time: string; reason: string }> = [];
    ALL_TIME_SLOTS.forEach((slot) => {
      const hour = parseSlotToHour(slot);
      if (allCourts) {
        for (let c = 1; c <= 11; c++) {
          const { isBlocked: blocked, reason } = isSlotBlocked(blockedSlotsData, c, date, hour);
          if (blocked) {
            blockedSlots.push({ court_number: c, slot_time: slot, reason });
          }
        }
      } else {
        const { isBlocked: blocked, reason } = isSlotBlocked(blockedSlotsData, courtNum, date, hour);
        if (blocked) {
          blockedSlots.push({ court_number: courtNum, slot_time: slot, reason });
        }
      }
    });

    let bookedSlots: string[] = [];
    let allBookingsList: any[] = [];

    // 1. Fetch from In-Memory Store
    const memorySlots = getMockSlots().filter(
      (s) =>
        s.slot_date === date &&
        s.status === 'booked' &&
        (allCourts || s.court_number === courtNum)
    );

    // 2. Fetch from Supabase (if configured)
    if (isSupabaseConfigured) {
      try {
        const supabase = createServerClient();
        let query = supabase
          .from('booking_slots')
          .select('id, booking_id, court_id, slot_date, slot_time, status, bookings(id, booking_code, customer_name, customer_phone, total_amount)')
          .eq('slot_date', date)
          .eq('status', 'booked');

        if (!allCourts && courtId) {
          const resolvedCourtId = await resolveSupabaseCourtId(courtId, supabase);
          query = query.eq('court_id', resolvedCourtId);
        }

        const { data, error } = await query;
        if (!error && data) {
          allBookingsList = data.map((item: any) => {
            const courtNumber = item.court_id.startsWith('c') ? parseCourtNumber(item.court_id) : parseCourtNumber(item.court_id);
            return {
              id: item.id,
              booking_id: item.booking_id,
              court_number: courtNumber,
              slot_time: item.slot_time,
              slot_date: item.slot_date,
              customer_name: item.bookings?.customer_name || 'Booked Player',
              customer_phone: item.bookings?.customer_phone || '',
              booking_code: item.bookings?.booking_code || '',
            };
          });

          bookedSlots = data.map((s: any) => s.slot_time);
        }
      } catch (err) {
        console.warn('Supabase bookings query error:', err);
      }
    }

    // Merge in memory slots
    memorySlots.forEach((ms) => {
      if (!bookedSlots.includes(ms.slot_time)) {
        bookedSlots.push(ms.slot_time);
      }
      allBookingsList.push({
        id: ms.id || `mock-${Date.now()}`,
        booking_id: ms.booking_id || 'mock-bid',
        court_number: ms.court_number,
        slot_time: ms.slot_time,
        slot_date: ms.slot_date,
        customer_name: ms.customer_name || 'Walk-in Player',
        customer_phone: ms.customer_phone || '9876543210',
        booking_code: ms.booking_code || 'GS-WALKIN',
      });
    });

    return NextResponse.json({
      success: true,
      bookedSlots,
      blockedSlots,
      pricingRules,
      allBookings: allBookingsList,
    });
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
    } = body;

    if (!courtId || !customerName || !customerPhone || !bookingDate || !selectedSlots || selectedSlots.length === 0) {
      return NextResponse.json({ error: 'Missing required booking fields.' }, { status: 400 });
    }

    // Prevent past date bookings
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

    // 1. Check if ANY slot is blocked for maintenance
    const blockedData = await getBlockedSlots(bookingDate);
    for (const slot of selectedSlots) {
      const hour = parseSlotToHour(slot);
      const { isBlocked, reason } = isSlotBlocked(blockedData, courtNum, bookingDate, hour);
      if (isBlocked) {
        return NextResponse.json(
          { error: `Court ${courtNum} is blocked for ${reason} at ${slot}. Please choose another court or time.` },
          { status: 409 }
        );
      }
    }

    // 2. Calculate dynamic price based on active rules
    const pricingRules = await getPricingRules();
    let totalCalculatedAmount = 0;
    const slotPriceBreakdown = selectedSlots.map((slot: string) => {
      const hour = parseSlotToHour(slot);
      const { price, isDiscounted, ruleName } = calculateSlotPriceFromRules(pricingRules, courtNum, hour);
      totalCalculatedAmount += price;
      return { slot, hour, price, isDiscounted, ruleName };
    });

    const bookingCode = `GS-${Math.floor(100000 + Math.random() * 900000)}`;

    // 3. Save Booking & Slots
    const mockSlotRecords = selectedSlots.map((slot: string) => {
      const hour = parseSlotToHour(slot);
      const { price } = calculateSlotPriceFromRules(pricingRules, courtNum, hour);
      return {
        id: `mock-slot-${Date.now()}-${Math.random()}`,
        court_id: `c${courtNum}`,
        court_number: courtNum,
        slot_date: bookingDate,
        slot_time: slot,
        status: 'booked' as const,
        booking_code: bookingCode,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        price,
      };
    });

    addMockSlots(mockSlotRecords);

    // If Supabase is configured, also persist to database
    if (isSupabaseConfigured) {
      try {
        const supabase = createServerClient();
        const resolvedCourtId = await resolveSupabaseCourtId(courtId, supabase);

        const { data: newBooking, error: bookingErr } = await supabase
          .from('bookings')
          .insert({
            booking_code: bookingCode,
            court_id: resolvedCourtId,
            customer_name: customerName.trim(),
            customer_phone: customerPhone.trim(),
            booking_date: bookingDate,
            total_hours: selectedSlots.length,
            price_per_hour: Math.round(totalCalculatedAmount / selectedSlots.length),
            total_amount: totalCalculatedAmount,
            status: 'confirmed',
          })
          .select()
          .single();

        if (!bookingErr && newBooking) {
          const slotInserts = selectedSlots.map((slot: string) => ({
            booking_id: newBooking.id,
            court_id: resolvedCourtId,
            slot_date: bookingDate,
            slot_time: slot,
            status: 'booked',
          }));
          await supabase.from('booking_slots').insert(slotInserts);
        }
      } catch (dbErr) {
        console.warn('Supabase booking save error:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      booking: {
        booking_code: bookingCode,
        court_number: courtNum,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        booking_date: bookingDate,
        slots: selectedSlots,
        total_amount: totalCalculatedAmount,
        breakdown: slotPriceBreakdown,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
