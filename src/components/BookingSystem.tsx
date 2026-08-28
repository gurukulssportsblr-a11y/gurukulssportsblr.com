'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { MORNING_SLOTS, AFTERNOON_EVENING_SLOTS, DEFAULT_COURTS, DefaultCourt, isSlotPassed, parseSlotToHour } from '@/lib/constants';
import BookingSuccessModal from './BookingSuccessModal';
import CancelBookingModal from './CancelBookingModal';

interface PricingRule {
  id: string;
  rule_name: string;
  start_hour: number;
  end_hour: number;
  price_per_hour: number;
  court_scope: 'ALL' | 'CUSTOM';
  is_active: boolean;
}

interface BlockedSlotItem {
  court_number: number;
  slot_time: string;
  reason: string;
}

export default function BookingSystem() {
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const [courts, setCourts] = useState<DefaultCourt[]>(DEFAULT_COURTS);
  const [selectedCourtId, setSelectedCourtId] = useState<string>(DEFAULT_COURTS[0].id);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
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

  // Surface filter
  const [surfaceFilter, setSurfaceFilter] = useState<'ALL' | 'Synthetic' | 'Wooden'>('ALL');

  // Fetch Courts
  useEffect(() => {
    async function fetchCourts() {
      try {
        const res = await fetch('/api/courts');
        if (res.ok) {
          const data = await res.json();
          if (data.courts && data.courts.length > 0) {
            setCourts(data.courts);
            if (!data.courts.find((c: any) => c.id === selectedCourtId)) {
              setSelectedCourtId(data.courts[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load courts from API:', err);
      }
    }
    fetchCourts();
  }, []);

  // Fetch Booked Slots & Blocked Slots for current court & date
  const fetchBookedSlots = useCallback(async () => {
    if (!selectedCourtId || !selectedDate) return;
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/bookings?courtId=${selectedCourtId}&date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setBookedSlots(data.bookedSlots || []);
        setBlockedSlots(data.blockedSlots || []);
        if (data.pricingRules) {
          setPricingRules(data.pricingRules);
        }
      }
    } catch (err) {
      console.error('Error fetching booked slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedCourtId, selectedDate]);

  useEffect(() => {
    fetchBookedSlots();
  }, [fetchBookedSlots]);

  // Current selected court object
  const currentCourt = useMemo(() => {
    return courts.find((c) => c.id === selectedCourtId) || courts[0] || DEFAULT_COURTS[0];
  }, [courts, selectedCourtId]);

  const currentCourtNumber = useMemo(() => {
    const match = String(currentCourt.id).match(/\d+/);
    return match ? parseInt(match[0], 10) : currentCourt.court_number || 1;
  }, [currentCourt]);

  // Filtered courts list
  const filteredCourts = useMemo(() => {
    if (surfaceFilter === 'ALL') return courts;
    return courts.filter((c) => c.surface_type === surfaceFilter);
  }, [courts, surfaceFilter]);

  // Helper to compute slot pricing dynamically
  const getSlotPricing = useCallback(
    (slotStr: string) => {
      const hour = parseSlotToHour(slotStr);
      let price = currentCourt.price_per_hour || 300;
      let isDiscounted = false;
      let ruleName = '';

      for (const rule of pricingRules) {
        if (!rule.is_active) continue;
        if (hour >= rule.start_hour && hour < rule.end_hour) {
          if (rule.court_scope === 'ALL' || (rule.court_scope === 'CUSTOM' && currentCourtNumber <= 5)) {
            price = Number(rule.price_per_hour);
            isDiscounted = price < (currentCourt.price_per_hour || 300);
            ruleName = rule.rule_name;
            break;
          }
        }
      }
      return { price, isDiscounted, ruleName };
    },
    [currentCourt, currentCourtNumber, pricingRules]
  );

  // Pricing calculation
  const totalHours = selectedSlots.length;
  const totalAmount = useMemo(() => {
    return selectedSlots.reduce((sum, slot) => sum + getSlotPricing(slot).price, 0);
  }, [selectedSlots, getSlotPricing]);

  // Toggle slot selection
  const toggleSlot = (slot: string) => {
    if (isSlotPassed(slot, selectedDate)) return;
    if (bookedSlots.includes(slot)) return;
    if (blockedSlots.some((b) => b.slot_time === slot)) return;

    setErrorMessage('');
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot].sort()
    );
  };

  // Format date for summary
  const formattedSummaryDate = useMemo(() => {
    try {
      return format(parseISO(selectedDate), 'EEE, dd MMM yyyy');
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Handle Form Submit
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit Indian phone number.');
      return;
    }
    if (selectedSlots.length === 0) {
      setErrorMessage('Please select at least one time slot.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        courtId: currentCourt.id,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        bookingDate: selectedDate,
        selectedSlots,
        frequency: 'one-time',
        repeatUntil: null,
        totalAmount,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to book slots. Please try another slot.');
        setIsSubmitting(false);
        return;
      }

      // Optimistic slot lock
      setBookedSlots((prev) => [...prev, ...selectedSlots]);

      // Open Success Modal
      setSuccessModalData({
        booking_code: data.booking.booking_code,
        customer_name: customerName.trim(),
        customer_phone: cleanPhone,
        courtName: currentCourt.name,
        surfaceType: currentCourt.surface_type,
        booking_date: selectedDate,
        slots: selectedSlots,
        frequency: 'one-time',
        total_hours: selectedSlots.length,
        total_amount: data.booking.total_amount || totalAmount,
      });

      // Clear Form
      setSelectedSlots([]);
      setCustomerName('');
      setCustomerPhone('');
      setIsSubmitting(false);
    } catch (err: any) {
      console.error('Booking submission error:', err);
      setErrorMessage('Network connection error. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Helper to render individual slot button
  const renderSlotButton = (slot: string) => {
    const isPassed = isSlotPassed(slot, selectedDate);
    const isBooked = bookedSlots.includes(slot);
    const blockedInfo = blockedSlots.find((b) => b.slot_time === slot);
    const isBlocked = Boolean(blockedInfo);
    const isSelected = selectedSlots.includes(slot);
    const isDisabled = isPassed || isBooked || isBlocked;
    const { price, isDiscounted } = getSlotPricing(slot);

    if (isBlocked) {
      return (
        <button
          key={slot}
          type="button"
          disabled
          title={`Court is blocked: ${blockedInfo?.reason || 'Maintenance'}`}
          className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-100/90 text-amber-900 border border-amber-300 line-through cursor-not-allowed flex flex-col items-center justify-center min-w-[90px] shadow-sm"
        >
          <span>{slot}</span>
          <span className="text-[9px] font-extrabold uppercase text-amber-800 tracking-tight no-underline">⚠️ Maintenance</span>
        </button>
      );
    }

    if (isBooked) {
      return (
        <button
          key={slot}
          type="button"
          disabled
          title="Slot is already booked"
          className="court-slot booked px-3 py-2 rounded-xl text-xs font-bold text-center min-w-[90px] cursor-not-allowed opacity-80"
        >
          <span>{slot}</span>
          <span className="text-[9px] text-slate-400 block font-medium">Booked</span>
        </button>
      );
    }

    if (isPassed) {
      return (
        <button
          key={slot}
          type="button"
          disabled
          title="Slot time has passed"
          className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 bg-slate-100 border border-slate-200 line-through cursor-not-allowed text-center min-w-[90px]"
        >
          {slot}
        </button>
      );
    }

    return (
      <button
        key={slot}
        type="button"
        disabled={isDisabled}
        onClick={() => toggleSlot(slot)}
        title={isDiscounted ? `Special Discounted Rate: ₹${price}/hr` : `Standard Rate: ₹${price}/hr`}
        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all min-w-[90px] text-center flex flex-col items-center justify-center border shadow-sm ${
          isSelected
            ? 'bg-[#0F172A] text-white border-[#0F172A] ring-2 ring-blue-500 shadow-md scale-105'
            : isDiscounted
            ? 'bg-blue-50/80 hover:bg-blue-100 text-blue-900 border-blue-300 hover:border-blue-500'
            : 'bg-emerald-50/60 hover:bg-emerald-100 text-slate-800 border-emerald-300/80 hover:border-emerald-500'
        }`}
      >
        <div className="flex items-center gap-1">
          <span>{slot}</span>
          {isDiscounted && !isSelected && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className={`text-[10px] font-extrabold ${isSelected ? 'text-emerald-300' : isDiscounted ? 'text-blue-700' : 'text-slate-600'}`}>
            ₹{price}
          </span>
          {isDiscounted && !isSelected && (
            <span className="text-[8px] bg-blue-600 text-white px-1 py-0.2 rounded font-extrabold uppercase tracking-tight">
              OFFER
            </span>
          )}
        </div>
      </button>
    );
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
          Reserve your preferred court and time slot at Gurukul's Sports Academy Thubrahalli with live availability.
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
        
        {/* Left 2 Cols: Step by Step Selector */}
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
                    setSelectedSlots([]);
                  }}
                  className="px-3 py-1 bg-surface-container text-[#0F172A] text-xs font-bold rounded-lg hover:bg-surface-container-high transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');
                    setSelectedDate(tomorrow);
                    setSelectedSlots([]);
                  }}
                  className="px-3 py-1 bg-surface-container text-[#0F172A] text-xs font-bold rounded-lg hover:bg-surface-container-high transition-colors"
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
                setSelectedSlots([]);
              }}
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl text-sm font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] transition-all cursor-pointer"
            />
          </div>

          {/* Step 2: Court Selector */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/50 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h3 className="font-title-md text-title-md font-bold text-[#0F172A] flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#0F172A] text-white text-xs flex items-center justify-center font-bold">2</span>
                Select Court
              </h3>

              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container rounded-lg text-xs font-semibold text-[#0F172A]">
                <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                11 BWF Synthetic Courts • ₹300/hr standard
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {courts.map((court) => {
                const isSelected = court.id === selectedCourtId;
                return (
                  <button
                    key={court.id}
                    type="button"
                    onClick={() => {
                      setSelectedCourtId(court.id);
                      setSelectedSlots([]);
                    }}
                    className={`py-3 px-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-md scale-102 ring-2 ring-[#2563EB]/40'
                        : 'bg-surface text-on-surface border-outline-variant/50 hover:border-[#2563EB] hover:bg-surface-container'
                    }`}
                  >
                    <span className="font-label-md text-xs sm:text-sm font-bold">{court.name}</span>
                    <span
                      className={`text-[9px] uppercase tracking-wider mt-1 px-1.5 py-0.5 rounded font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#2563EB]/15 text-[#2563EB]'
                      }`}
                    >
                      Synthetic
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Time Slots */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/50 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h3 className="font-title-md text-title-md font-bold text-[#0F172A] flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#0F172A] text-white text-xs flex items-center justify-center font-bold">3</span>
                Select Time Slots
              </h3>

              {/* Legend */}
              <div className="flex items-center gap-3 flex-wrap text-xs">
                <div className="flex items-center gap-1.5 font-medium text-slate-600">
                  <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-400"></div>
                  Available
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-600">
                  <div className="w-3 h-3 rounded bg-blue-100 border border-blue-500"></div>
                  ⚡ Offer Slot
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-600">
                  <div className="w-3 h-3 rounded bg-[#0F172A]"></div>
                  Selected
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-600">
                  <div className="w-3 h-3 rounded bg-amber-100 border border-amber-400 text-[8px] font-bold text-amber-900 flex items-center justify-center">⚠️</div>
                  Blocked
                </div>
              </div>
            </div>

            {loadingSlots ? (
              <div className="py-8 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> Checking live court schedule...
              </div>
            ) : (
              <div className="space-y-5">
                {/* Morning Slots */}
                <div>
                  <h4 className="font-label-sm text-xs text-slate-500 mb-2.5 uppercase tracking-wider font-bold">
                    Morning Slots (6:00 AM – 12:00 PM)
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {MORNING_SLOTS.map((slot) => renderSlotButton(slot))}
                  </div>
                </div>

                {/* Afternoon / Evening Slots */}
                <div className="pt-3 border-t border-slate-200">
                  <h4 className="font-label-sm text-xs text-slate-500 mb-2.5 uppercase tracking-wider font-bold">
                    Afternoon &amp; Evening Slots (12:00 PM – 12:00 AM)
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {AFTERNOON_EVENING_SLOTS.map((slot) => renderSlotButton(slot))}
                  </div>
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
                Review your court &amp; schedule
              </p>
            </div>

            <form onSubmit={handleBookingSubmit} className="p-6 space-y-5">
              {/* Court & Date Info */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                <div>
                  <p className="font-label-md text-sm text-[#0F172A] font-bold">
                    {formattedSummaryDate}
                  </p>
                  <p className="font-label-sm text-xs text-slate-500 font-medium mt-0.5">
                    {currentCourt.name} ({currentCourt.surface_type})
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                    Live Verified
                  </span>
                </div>
              </div>

              {/* Selected Slots List */}
              <div>
                <p className="font-label-sm text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Selected Slots ({selectedSlots.length})
                </p>
                {selectedSlots.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No time slots chosen yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedSlots.map((slot) => {
                      const { price, isDiscounted, ruleName } = getSlotPricing(slot);
                      return (
                        <div key={slot} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="font-bold text-slate-800">{slot}</span>
                          <div className="flex items-center gap-1.5">
                            {isDiscounted && (
                              <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1 rounded truncate max-w-[90px]" title={ruleName}>
                                Offer
                              </span>
                            )}
                            <span className="font-bold text-slate-900">₹{price}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Price Calculation Total */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Duration:</span>
                  <span className="font-bold text-slate-900">{totalHours} Hour(s)</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-base">
                  <span className="font-bold text-slate-900">Grand Total:</span>
                  <span className="font-extrabold text-2xl text-emerald-600">₹{totalAmount}</span>
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
                    placeholder="e.g. Ramesh Kumar"
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
                    placeholder="e.g. 9876543210"
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
                  disabled={isSubmitting || selectedSlots.length === 0}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all ${
                    isSubmitting || selectedSlots.length === 0
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
          onClose={() => {
            setCancelModalOpen(false);
            fetchBookedSlots();
          }}
        />
      )}
    </section>
  );
}
