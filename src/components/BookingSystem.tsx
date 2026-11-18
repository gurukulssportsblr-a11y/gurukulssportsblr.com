'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import {
  DEFAULT_COURTS,
  DefaultCourt,
  isSlotPassed,
  parseSlotToHour,
  normalizeSlot,
  formatDecimalToTime,
  DURATION_OPTIONS,
  TimeWindow,
  generateTimeWindows,
} from '@/lib/constants';
import BookingSuccessModal from './BookingSuccessModal';
import CancelBookingModal from './CancelBookingModal';

interface PricingRule {
  id: string;
  rule_name: string;
  start_hour: number;
  end_hour: number;
  price_per_hour: number;
  court_scope: string;
  is_active: boolean;
}

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

function isCourtInRuleScope(scope: string, courtNumber: number): boolean {
  if (!scope || scope === 'ALL') return true;
  if (scope === 'CUSTOM') return courtNumber <= 5;
  const courts = scope
    .split(',')
    .map((s) => parseInt(s.trim().replace(/\D/g, ''), 10))
    .filter((n) => !isNaN(n));
  if (courts.length > 0) {
    return courts.includes(courtNumber);
  }
  return false;
}

interface BlockedSlotItem {
  court_number: number;
  slot_time: string;
  reason: string;
}

export default function BookingSystem() {
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  // Form selections
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedDuration, setSelectedDuration] = useState<number>(1.0); // Default 1 hour
  const [selectedWindow, setSelectedWindow] = useState<TimeWindow | null>(null);
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);

  // Server state
  const [courts, setCourts] = useState<DefaultCourt[]>(DEFAULT_COURTS);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlotItem[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // Form Fields
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Modals
  const [successModalData, setSuccessModalData] = useState<any | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);
  const [lookupMode, setLookupMode] = useState<'view' | 'cancel'>('view');

  // Fetch Courts Catalog on Mount
  useEffect(() => {
    async function fetchCourtsList() {
      try {
        const courtsRes = await fetch('/api/courts');
        if (courtsRes.ok) {
          const data = await courtsRes.json();
          if (data.courts && data.courts.length > 0) {
            setCourts(data.courts);
          }
        }
      } catch (err) {
        console.error('Failed to load courts:', err);
      }
    }
    fetchCourtsList();
  }, []);

  // Fetch All Court Bookings & Blocked Slots for Selected Date
  const fetchBookedSlots = useCallback(async (isBackground = false) => {
    if (!selectedDate) return;
    if (!isBackground) setLoadingSlots(true);
    try {
      const res = await fetch(`/api/bookings?allCourts=true&date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setAllBookings(data.allBookings || []);
        setBlockedSlots(data.blockedSlots || []);
        if (data.pricingRules) {
          setPricingRules(data.pricingRules);
        }
      }
    } catch (err) {
      console.error('Error fetching booked slots:', err);
    } finally {
      if (!isBackground) setLoadingSlots(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchBookedSlots();

    const handleFocus = () => fetchBookedSlots(true);
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(() => fetchBookedSlots(true), 8000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [fetchBookedSlots]);

  // Generate valid time windows based on current duration (30 min to 4 hrs)
  const timeWindows = useMemo(() => {
    return generateTimeWindows(selectedDuration);
  }, [selectedDuration]);

  // Check if a specific court is available for all slots in a time window
  const isCourtAvailableForWindow = useCallback(
    (courtNumber: number, window: TimeWindow) => {
      for (const slot of window.slots) {
        if (isSlotPassed(slot, selectedDate)) return false;
        const norm = normalizeSlot(slot);

        // Check if booked
        const isBooked = allBookings.some(
          (b) =>
            b.court_number === courtNumber &&
            normalizeSlot(b.slot_time) === norm
        );
        if (isBooked) return false;

        // Check if blocked by admin / maintenance
        const isBlocked = blockedSlots.some(
          (b) =>
            (b.court_number === courtNumber || b.court_number === 0) &&
            normalizeSlot(b.slot_time) === norm
        );
        if (isBlocked) return false;
      }
      return true;
    },
    [selectedDate, allBookings, blockedSlots]
  );

  // Return the list of courts that are available for a given time window
  const getAvailableCourtsForWindow = useCallback(
    (window: TimeWindow) => {
      return courts.filter((court) => {
        const courtNum = court.court_number || parseCourtNumber(court.id);
        return isCourtAvailableForWindow(courtNum, window);
      });
    },
    [courts, isCourtAvailableForWindow]
  );

  // Available courts for the currently selected time window
  const availableCourtsForSelectedWindow = useMemo(() => {
    if (!selectedWindow) return [];
    return getAvailableCourtsForWindow(selectedWindow);
  }, [selectedWindow, getAvailableCourtsForWindow]);

  // Check if currently selected court is still available
  useEffect(() => {
    if (!selectedWindow) {
      setSelectedCourtId(null);
      return;
    }
    if (selectedCourtId) {
      const stillValid = availableCourtsForSelectedWindow.some((c) => c.id === selectedCourtId);
      if (!stillValid) {
        setSelectedCourtId(null);
      }
    }
  }, [selectedWindow, availableCourtsForSelectedWindow, selectedCourtId]);

  // Selected Court Object
  const selectedCourt = useMemo(() => {
    if (!selectedCourtId) return null;
    return courts.find((c) => c.id === selectedCourtId) || null;
  }, [courts, selectedCourtId]);

  // Compute pricing for an individual 30-min slot on a court
  const getSlotPricing = useCallback(
    (slotStr: string, courtNumber: number) => {
      const hour = parseSlotToHour(slotStr);
      const targetCourt =
        courts.find((c) => (c.court_number || parseCourtNumber(c.id)) === courtNumber) || courts[0];
      let hourlyPrice = targetCourt?.price_per_hour || 300;
      let isDiscounted = false;
      let ruleName = '';

      const sortedRules = [...pricingRules].sort((a, b) => {
        const aIsAll = !a.court_scope || a.court_scope === 'ALL';
        const bIsAll = !b.court_scope || b.court_scope === 'ALL';
        if (!aIsAll && bIsAll) return -1;
        if (aIsAll && !bIsAll) return 1;
        return 0;
      });

      for (const rule of sortedRules) {
        if (!rule.is_active) continue;
        if (hour >= rule.start_hour && hour < rule.end_hour) {
          if (isCourtInRuleScope(rule.court_scope, courtNumber)) {
            hourlyPrice = Number(rule.price_per_hour);
            isDiscounted = hourlyPrice < (targetCourt?.price_per_hour || 300);
            ruleName = rule.rule_name;
            break;
          }
        }
      }

      const price = Math.round(hourlyPrice / 2);
      return { price, isDiscounted, ruleName };
    },
    [courts, pricingRules]
  );

  // Compute total price for a court over the selected time window
  const computeWindowPriceForCourt = useCallback(
    (court: DefaultCourt, window: TimeWindow) => {
      const courtNum = court.court_number || parseCourtNumber(court.id);
      let total = 0;
      let hasDiscount = false;
      for (const slot of window.slots) {
        const pricing = getSlotPricing(slot, courtNum);
        total += pricing.price;
        if (pricing.isDiscounted) hasDiscount = true;
      }
      return { total, hasDiscount };
    },
    [getSlotPricing]
  );

  // Grand total for current selection
  const grandTotal = useMemo(() => {
    if (!selectedWindow || !selectedCourt) return 0;
    return computeWindowPriceForCourt(selectedCourt, selectedWindow).total;
  }, [selectedWindow, selectedCourt, computeWindowPriceForCourt]);

  // Format date for summary
  const formattedSummaryDate = useMemo(() => {
    try {
      return format(parseISO(selectedDate), 'EEE, dd MMM yyyy');
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Handle slot window pick
  const handleSelectWindow = (window: TimeWindow) => {
    setSelectedWindow(window);
    setSelectedCourtId(null);
    setErrorMessage('');
    fetchBookedSlots(true); // Instant background refresh to verify live availability
  };

  // Handle Duration change
  const handleDurationChange = (duration: number) => {
    setSelectedDuration(duration);
    setSelectedWindow(null);
    setSelectedCourtId(null);
    setErrorMessage('');
  };

  // Handle Form Submit
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedWindow) {
      setErrorMessage('Please select a time slot.');
      return;
    }
    if (!selectedCourt) {
      setErrorMessage('Please choose an available court.');
      return;
    }
    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        courtId: selectedCourt.id,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        bookingDate: selectedDate,
        selectedSlots: selectedWindow.slots,
        frequency: 'one-time',
        repeatUntil: null,
        totalAmount: grandTotal,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to book court. Please select another court or time slot.');
        setIsSubmitting(false);
        fetchBookedSlots(true);
        return;
      }

      // Success
      setSuccessModalData({
        booking_code: data.booking.booking_code,
        customer_name: customerName.trim(),
        customer_phone: cleanPhone,
        courtName: selectedCourt.name,
        surfaceType: selectedCourt.surface_type,
        booking_date: selectedDate,
        slots: selectedWindow.slots,
        frequency: 'one-time',
        total_hours: selectedDuration,
        total_amount: data.booking.total_amount || grandTotal,
      });

      // Reset
      setSelectedWindow(null);
      setSelectedCourtId(null);
      setCustomerName('');
      setCustomerPhone('');
      setIsSubmitting(false);
      fetchBookedSlots(true);
    } catch (err: any) {
      console.error('Booking submission error:', err);
      setErrorMessage('Network connection error. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-stack-lg px-margin-mobile md:px-margin-desktop bg-surface max-w-container-max mx-auto" id="book-court">
      {/* Title Header */}
      <div className="text-center mb-10">
        <span className="inline-block px-3 py-1 bg-[#2563EB]/10 text-[#2563EB] text-xs font-label-md font-bold rounded-full mb-3 uppercase tracking-wider">
          Instant Online Reservation
        </span>
        <h2 className="font-headline-lg text-headline-lg text-[#0F172A] mb-3">Book Badminton Court</h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mx-auto">
          Choose your date and duration, pick a time slot, and reserve verified available courts at Gurukul's Sports Academy.
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold flex items-center gap-3 animate-shake">
          <span className="material-symbols-outlined text-[20px] text-red-600">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start max-w-6xl mx-auto">
        
        {/* Left 2 Cols: Step by Step Flow */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Step 1: Date Selector */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/50 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h3 className="font-title-md text-title-md font-bold text-[#0F172A] flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#0F172A] text-white text-xs flex items-center justify-center font-bold">1</span>
                Select Date
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(todayStr);
                    setSelectedWindow(null);
                    setSelectedCourtId(null);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    selectedDate === todayStr
                      ? 'bg-[#0F172A] text-white'
                      : 'bg-surface-container text-[#0F172A] hover:bg-surface-container-high'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');
                    setSelectedDate(tomorrow);
                    setSelectedWindow(null);
                    setSelectedCourtId(null);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    selectedDate !== todayStr
                      ? 'bg-[#0F172A] text-white'
                      : 'bg-surface-container text-[#0F172A] hover:bg-surface-container-high'
                  }`}
                >
                  Tomorrow
                </button>
              </div>
            </div>

            <input
              type="date"
              min={todayStr}
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedWindow(null);
                setSelectedCourtId(null);
              }}
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl text-sm font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] transition-all cursor-pointer"
            />
          </div>

          {/* Step 2: Duration Selector */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/50 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h3 className="font-title-md text-title-md font-bold text-[#0F172A] flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#0F172A] text-white text-xs flex items-center justify-center font-bold">2</span>
                Select Duration
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                Min 30 mins • Max 4 hours • 30m steps
              </span>
            </div>

            {/* Duration Pills Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {DURATION_OPTIONS.map((opt) => {
                const isSelected = selectedDuration === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleDurationChange(opt.value)}
                    className={`py-3 px-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-md ring-2 ring-[#2563EB]/40 scale-102'
                        : 'bg-surface text-slate-800 border-outline-variant/60 hover:border-[#2563EB] hover:bg-surface-container'
                    }`}
                  >
                    <span className="font-bold text-sm">{opt.label}</span>
                    <span
                      className={`text-[10px] mt-0.5 font-medium ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {opt.sublabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Time Slot Matrix */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/50 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h3 className="font-title-md text-title-md font-bold text-[#0F172A] flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#0F172A] text-white text-xs flex items-center justify-center font-bold">3</span>
                Select Time Slot ({selectedDuration === 0.5 ? '30 Mins' : `${selectedDuration} Hours`})
              </h3>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Select a slot to check available courts</span>
              </div>
            </div>

            {loadingSlots ? (
              <div className="py-8 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> Checking live arena schedule...
              </div>
            ) : (
              <div className="space-y-5">
                {/* Morning Slots */}
                <div>
                  <h4 className="font-label-sm text-xs text-slate-500 mb-2.5 uppercase tracking-wider font-bold">
                    Morning Sessions (06:00 AM – 12:00 PM)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {timeWindows
                      .filter((w) => w.isMorning)
                      .map((w) => {
                        const isSelected = selectedWindow?.id === w.id;
                        const isPassed = isSlotPassed(w.startTime, selectedDate);
                        const freeCourts = getAvailableCourtsForWindow(w);
                        const isFullyBooked = !isPassed && freeCourts.length === 0;

                        return (
                          <button
                            key={w.id}
                            type="button"
                            disabled={isPassed}
                            onClick={() => handleSelectWindow(w)}
                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                              isPassed
                                ? 'bg-slate-100 text-slate-400 border-slate-200 line-through cursor-not-allowed opacity-60'
                                : isSelected
                                ? 'bg-[#0F172A] text-white border-[#0F172A] ring-2 ring-[#2563EB] shadow-md scale-102'
                                : isFullyBooked
                                ? 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                                : 'bg-surface hover:bg-surface-container border-outline-variant/60 hover:border-[#2563EB]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs sm:text-sm tracking-tight">{w.label}</span>
                              {isSelected && (
                                <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
                              )}
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[11px]">
                              <span className={`font-semibold ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                {selectedDuration === 0.5 ? '30m' : `${selectedDuration}h`}
                              </span>
                              {isPassed ? (
                                <span className="text-slate-400 font-medium">Passed</span>
                              ) : isFullyBooked ? (
                                <span className="text-red-500 font-bold text-[10px] uppercase">Fully Booked</span>
                              ) : (
                                <span
                                  className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                    isSelected
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  {freeCourts.length} {freeCourts.length === 1 ? 'court' : 'courts'} free
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Afternoon & Evening Slots */}
                <div className="pt-3 border-t border-slate-200">
                  <h4 className="font-label-sm text-xs text-slate-500 mb-2.5 uppercase tracking-wider font-bold">
                    Afternoon &amp; Evening Sessions (12:00 PM – 12:00 AM)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {timeWindows
                      .filter((w) => !w.isMorning)
                      .map((w) => {
                        const isSelected = selectedWindow?.id === w.id;
                        const isPassed = isSlotPassed(w.startTime, selectedDate);
                        const freeCourts = getAvailableCourtsForWindow(w);
                        const isFullyBooked = !isPassed && freeCourts.length === 0;

                        return (
                          <button
                            key={w.id}
                            type="button"
                            disabled={isPassed}
                            onClick={() => handleSelectWindow(w)}
                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                              isPassed
                                ? 'bg-slate-100 text-slate-400 border-slate-200 line-through cursor-not-allowed opacity-60'
                                : isSelected
                                ? 'bg-[#0F172A] text-white border-[#0F172A] ring-2 ring-[#2563EB] shadow-md scale-102'
                                : isFullyBooked
                                ? 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                                : 'bg-surface hover:bg-surface-container border-outline-variant/60 hover:border-[#2563EB]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs sm:text-sm tracking-tight">{w.label}</span>
                              {isSelected && (
                                <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
                              )}
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[11px]">
                              <span className={`font-semibold ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                {selectedDuration === 0.5 ? '30m' : `${selectedDuration}h`}
                              </span>
                              {isPassed ? (
                                <span className="text-slate-400 font-medium">Passed</span>
                              ) : isFullyBooked ? (
                                <span className="text-red-500 font-bold text-[10px] uppercase">Fully Booked</span>
                              ) : (
                                <span
                                  className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                    isSelected
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  {freeCourts.length} {freeCourts.length === 1 ? 'court' : 'courts'} free
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 4: Available Courts (Checked against Database) */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/50 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h3 className="font-title-md text-title-md font-bold text-[#0F172A] flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#0F172A] text-white text-xs flex items-center justify-center font-bold">4</span>
                Select Available Court
              </h3>

              {selectedWindow && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Database Verified for {selectedWindow.label}</span>
                </div>
              )}
            </div>

            {!selectedWindow ? (
              <div className="py-8 text-center text-slate-500 bg-surface rounded-xl border border-dashed border-outline-variant p-6">
                <span className="material-symbols-outlined text-[36px] text-slate-400 block mb-2">schedule</span>
                <p className="text-sm font-semibold text-slate-700">Please select a time slot above first</p>
                <p className="text-xs text-slate-500 mt-1">
                  Available courts for your chosen duration will be queried directly from the arena schedule.
                </p>
              </div>
            ) : availableCourtsForSelectedWindow.length === 0 ? (
              <div className="py-8 text-center text-red-600 bg-red-50/80 rounded-xl border border-red-200 p-6">
                <span className="material-symbols-outlined text-[36px] text-red-500 block mb-2">event_busy</span>
                <p className="text-sm font-bold text-red-800">
                  All 11 courts are booked for {selectedWindow.label}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Please pick another time slot from the list above or try a different date.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-600 mb-3 font-medium">
                  Showing <strong className="text-slate-900">{availableCourtsForSelectedWindow.length} courts</strong> available for the full {selectedDuration === 0.5 ? '30-minute' : `${selectedDuration}-hour`} duration:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {availableCourtsForSelectedWindow.map((court) => {
                    const isSelected = selectedCourtId === court.id;
                    const { total, hasDiscount } = computeWindowPriceForCourt(court, selectedWindow);

                    return (
                      <button
                        key={court.id}
                        type="button"
                        onClick={() => {
                          setSelectedCourtId(court.id);
                          setErrorMessage('');
                        }}
                        className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-lg ring-2 ring-[#2563EB] scale-102'
                            : 'bg-surface hover:bg-surface-container text-slate-800 border-outline-variant/60 hover:border-[#2563EB]'
                        }`}
                      >
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-sm sm:text-base">{court.name}</span>
                            {isSelected ? (
                              <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
                            ) : (
                              <span className="w-4 h-4 rounded-full border border-slate-300"></span>
                            )}
                          </div>
                          <span
                            className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded inline-block ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {court.surface_type || 'Synthetic'}
                          </span>
                        </div>

                        <div className="mt-3 pt-2 w-full border-t border-slate-200/40 flex items-center justify-between">
                          <span className={`text-xs font-bold ${isSelected ? 'text-emerald-300' : 'text-slate-900'}`}>
                            ₹{total}
                          </span>
                          {hasDiscount && (
                            <span className="text-[9px] bg-blue-600 text-white font-extrabold px-1 py-0.2 rounded uppercase">
                              OFFER
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Booking Summary Sticky Card */}
        <div className="lg:col-span-1">
          <div className="bg-surface-container-lowest rounded-2xl border border-[#2563EB]/20 shadow-xl sticky top-28 overflow-hidden">
            <div className="bg-[#0F172A] p-6 text-white">
              <h3 className="font-title-md text-title-md font-bold mb-1">Booking Summary</h3>
              <p className="font-label-sm text-xs text-slate-400">
                Review your schedule and confirm reservation
              </p>
            </div>

            <form onSubmit={handleBookingSubmit} className="p-6 space-y-5">
              {/* Summary Details */}
              <div className="space-y-3 pb-4 border-b border-slate-200 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Date:</span>
                  <span className="font-bold text-slate-900">{formattedSummaryDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Duration:</span>
                  <span className="font-bold text-slate-900">
                    {selectedDuration === 0.5 ? '30 Mins (0.5 hr)' : `${selectedDuration} Hours`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Time Slot:</span>
                  <span className={`font-bold ${selectedWindow ? 'text-blue-700' : 'text-slate-400 italic'}`}>
                    {selectedWindow ? selectedWindow.label : 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Selected Court:</span>
                  <span className={`font-bold ${selectedCourt ? 'text-emerald-700' : 'text-slate-400 italic'}`}>
                    {selectedCourt ? `${selectedCourt.name} (${selectedCourt.surface_type})` : 'Not selected'}
                  </span>
                </div>
              </div>

              {/* Slot Breakdown List */}
              {selectedWindow && selectedCourt && (
                <div className="space-y-1.5">
                  <p className="font-label-sm text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Slot Breakdown ({selectedWindow.slots.length} × 30m)
                  </p>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {selectedWindow.slots.map((slot) => {
                      const courtNum = selectedCourt.court_number || parseCourtNumber(selectedCourt.id);
                      const pricing = getSlotPricing(slot, courtNum);
                      return (
                        <div
                          key={slot}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 border border-slate-200"
                        >
                          <span className="font-bold text-slate-800">{slot}</span>
                          <div className="flex items-center gap-1.5">
                            {pricing.isDiscounted && (
                              <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1 rounded truncate max-w-[80px]">
                                Offer
                              </span>
                            )}
                            <span className="font-bold text-slate-900">₹{pricing.price}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Price Calculation Total */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Standard Rate:</span>
                  <span className="font-semibold text-slate-800">₹150 / 30 mins</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-base">
                  <span className="font-bold text-slate-900">Grand Total:</span>
                  <span className="font-extrabold text-2xl text-emerald-600">₹{grandTotal}</span>
                </div>
              </div>

              {/* Player Details Form */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Player Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number (10 Digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedWindow || !selectedCourt}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all ${
                    isSubmitting || !selectedWindow || !selectedCourt
                      ? 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
                      : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-lg active:scale-98'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin">⏳</span> Reserving Court...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      Confirm &amp; Book Court
                    </>
                  )}
                </button>

                {/* View Bookings Button */}
                <button
                  type="button"
                  onClick={() => {
                    setLookupMode('view');
                    setCancelModalOpen(true);
                  }}
                  className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs border border-blue-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                  View My Bookings
                </button>

                {/* Cancel Booking Button */}
                <button
                  type="button"
                  onClick={() => {
                    setLookupMode('cancel');
                    setCancelModalOpen(true);
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-red-600 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  Cancel existing booking
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modals */}
      {successModalData && (
        <BookingSuccessModal
          isOpen={Boolean(successModalData)}
          bookingData={successModalData}
          onClose={() => setSuccessModalData(null)}
        />
      )}

      {cancelModalOpen && (
        <CancelBookingModal
          initialMode={lookupMode}
          isOpen={cancelModalOpen}
          onBookingCancelled={() => {
            fetchBookedSlots();
          }}
          onClose={() => {
            setCancelModalOpen(false);
            fetchBookedSlots();
          }}
        />
      )}
    </section>
  );
}
