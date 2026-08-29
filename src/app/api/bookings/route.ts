export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { isSlotPassed, ALL_TIME_SLOTS, parseSlotToHour, getNowInIST, DEFAULT_COURTS } from '@/lib/constants';
import {
  getPricingRules,
  getBlockedSlots,
  calculateSlotPriceFromRules,
  isSlotBlocked,
  getMockSlots,
  addMockSlots,
  addMockBooking,
} from '@/lib/server-store';

function parseCourtNumber(courtIdOrNum: string | number): number {
  if (typeof courtIdOrNum === 'number') return courtIdOrNum;
  const str = String(courtIdOrNum).trim();
  if (str.startsWith('c') || str.startsWith('C')) {
    const num = parseInt(str.slice(1), 10);
    if (!isNaN(num) && num >= 1 && num <= 11) return num;
  }
  const match = str.match(/\b([1-9]|1[01])\b/);
  return match ? parseInt(match[0], 10) : 1;
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

    const supabase = isSupabaseConfigured ? createServerClient() : null;

    // Load Court Map from Supabase (UUID -> court_number and court_number -> UUID)
    const courtIdToNum = new Map<string, number>();
    const courtNumToId = new Map<number, string>();

    if (supabase) {
      try {
        const { data: courtsList } = await supabase.from('courts').select('id, court_number, name');
        courtsList?.forEach((c: any) => {
          courtIdToNum.set(c.id.toLowerCase(), c.court_number);
          courtNumToId.set(c.court_number, c.id);
        });
      } catch (err) {
        console.warn('Error loading courts map:', err);
      }
    }

    // Determine target court number
    let courtNum = 1;
    if (courtId) {
      const lowerCourtId = courtId.trim().toLowerCase();
      if (courtIdToNum.has(lowerCourtId)) {
        courtNum = courtIdToNum.get(lowerCourtId)!;
      } else {
        courtNum = parseCourtNumber(courtId);
      }
    }

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

    // Fetch from Supabase (if configured) or fallback to In-Memory store
    if (supabase) {
      try {
        let query = supabase
          .from('booking_slots')
          .select(`
            id,
            booking_id,
            court_id,
            slot_date,
            slot_time,
            status,
            bookings:booking_id (id, booking_code, customer_name, customer_phone, total_amount, status)
          `)
          .eq('slot_date', date)
          .eq('status', 'booked');

        const { data, error } = await query;
        if (!error && data) {
          data.forEach((item: any) => {
            const lowerCourtId = String(item.court_id).toLowerCase();
            const courtNumber = courtIdToNum.get(lowerCourtId) || parseCourtNumber(item.court_id);
            const bookingDetails = Array.isArray(item.bookings) ? item.bookings[0] : item.bookings;

            // Ensure booking itself is not cancelled
            if (bookingDetails?.status === 'cancelled') return;

            if (allCourts || courtNumber === courtNum) {
              allBookingsList.push({
                id: item.id,
                booking_id: item.booking_id,
                court_number: courtNumber,
                slot_time: item.slot_time,
                slot_date: item.slot_date,
                customer_name: bookingDetails?.customer_name || 'Booked Player',
                customer_phone: bookingDetails?.customer_phone || '',
                booking_code: bookingDetails?.booking_code || '',
              });

              if (courtNumber === courtNum && !bookedSlots.includes(item.slot_time)) {
                bookedSlots.push(item.slot_time);
              }
            }
          });
        }
      } catch (err) {
        console.warn('Supabase bookings query error:', err);
      }
    } else {
      // In-Memory Fallback ONLY when Supabase is offline
      const memorySlots = getMockSlots().filter(
        (s) =>
          s.slot_date === date &&
          s.status === 'booked' &&
          (allCourts || s.court_number === courtNum)
      );

      memorySlots.forEach((ms) => {
        if (ms.court_number === courtNum && !bookedSlots.includes(ms.slot_time)) {
          bookedSlots.push(ms.slot_time);
        }
        if (!allBookingsList.some((b) => b.court_number === ms.court_number && b.slot_time === ms.slot_time)) {
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
        }
      });
    }

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

    // Prevent past date bookings in Indian Standard Time (IST)
    const istNow = getNowInIST();
    const todayStr = `${istNow.getFullYear()}-${String(istNow.getMonth() + 1).padStart(2, '0')}-${String(istNow.getDate()).padStart(2, '0')}`;

    if (bookingDate < todayStr) {
      return NextResponse.json({ error: 'Cannot book courts for past dates.' }, { status: 400 });
    }

    if (bookingDate === todayStr) {
      const hasPassedSlot = selectedSlots.some((slot: string) => isSlotPassed(slot, bookingDate));
      if (hasPassedSlot) {
        return NextResponse.json({ error: 'One or more selected time slots have already passed today.' }, { status: 400 });
      }
    }

    const supabase = isSupabaseConfigured ? createServerClient() : null;

    // Resolve Court Number and Court UUID
    let courtNum = 1;
    let resolvedCourtId = String(courtId);

    if (supabase) {
      try {
        const { data: courtsList } = await supabase.from('courts').select('id, court_number, name');
        if (courtsList && courtsList.length > 0) {
          const lowerInput = String(courtId).trim().toLowerCase();
          const matchByUuid = courtsList.find((c: any) => c.id.toLowerCase() === lowerInput);
          if (matchByUuid) {
            courtNum = matchByUuid.court_number;
            resolvedCourtId = matchByUuid.id;
          } else {
            courtNum = parseCourtNumber(courtId);
            const matchByNum = courtsList.find((c: any) => c.court_number === courtNum);
            if (matchByNum) {
              resolvedCourtId = matchByNum.id;
            }
          }
        }
      } catch (err) {
        console.warn('Error resolving court in POST:', err);
      }
    } else {
      courtNum = parseCourtNumber(courtId);
    }

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
    const bookingId = `bid-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 3. Save to In-Memory Repository
    const mockSlotRecords = selectedSlots.map((slot: string) => {
      const hour = parseSlotToHour(slot);
      const { price } = calculateSlotPriceFromRules(pricingRules, courtNum, hour);
      return {
        id: `mock-slot-${Date.now()}-${Math.random()}`,
        booking_id: bookingId,
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
    addMockBooking({
      id: bookingId,
      booking_code: bookingCode,
      court_number: courtNum,
      court_id: `c${courtNum}`,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      booking_date: bookingDate,
      slots: selectedSlots,
      total_amount: totalCalculatedAmount,
      status: 'confirmed',
      created_at: new Date().toISOString(),
    });

    // 4. If Supabase is configured, persist to PostgreSQL database
    if (supabase) {
      try {
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

        if (bookingErr) {
          console.error('Supabase booking insert error:', bookingErr);
          return NextResponse.json({ error: `Database error: ${bookingErr.message}` }, { status: 500 });
        }

        if (newBooking) {
          const slotInserts = selectedSlots.map((slot: string) => ({
            booking_id: newBooking.id,
            court_id: resolvedCourtId,
            slot_date: bookingDate,
            slot_time: slot,
            status: 'booked',
          }));
          const { error: slotErr } = await supabase.from('booking_slots').insert(slotInserts);
          if (slotErr) {
            console.error('Supabase slot insert error:', slotErr);
            return NextResponse.json({ error: `Database slot error: ${slotErr.message}` }, { status: 500 });
          }
        }
      } catch (dbErr: any) {
        console.error('Supabase booking exception:', dbErr);
        return NextResponse.json({ error: `Database error: ${dbErr?.message || 'Database error'}` }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: bookingId,
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
