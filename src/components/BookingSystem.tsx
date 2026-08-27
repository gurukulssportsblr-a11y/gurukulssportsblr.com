'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { MORNING_SLOTS, AFTERNOON_EVENING_SLOTS, DEFAULT_COURTS, DefaultCourt } from '@/lib/constants';
import BookingSuccessModal from './BookingSuccessModal';
import CancelBookingModal from './CancelBookingModal';

type FrequencyType = 'one-time' | 'daily' | 'weekly_weekends' | 'weekly_sameday';

export default function BookingSystem() {
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const defaultEndDateStr = useMemo(() => format(addDays(new Date(), 7), 'yyyy-MM-dd'), []);

  const [courts, setCourts] = useState<DefaultCourt[]>(DEFAULT_COURTS);
  const [selectedCourtId, setSelectedCourtId] = useState<string>(DEFAULT_COURTS[0].id);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [frequency, setFrequency] = useState<FrequencyType>('one-time');
  const [endDate, setEndDate] = useState<string>(defaultEndDateStr);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // Form Fields
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Modals
  const [successModalData, setSuccessModalData] = useState<any | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);

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

  // Fetch Booked Slots for current court & date
  const fetchBookedSlots = useCallback(async () => {
    if (!selectedCourtId || !selectedDate) return;
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/bookings?courtId=${selectedCourtId}&date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setBookedSlots(data.bookedSlots || []);
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

  // Filtered courts list
  const filteredCourts = useMemo(() => {
    if (surfaceFilter === 'ALL') return courts;
    return courts.filter((c) => c.surface_type === surfaceFilter);
  }, [courts, surfaceFilter]);

  // Calculate repeat occurrences
  const recurrenceCount = useMemo(() => {
    if (frequency === 'one-time') return 1;
    try {
      const start = parseISO(selectedDate);
      const end = parseISO(endDate);
      if (end < start) return 1;

      let count = 0;
      let curr = start;
      while (curr <= end) {
        const day = curr.getDay();
        if (frequency === 'daily') count++;
        else if (frequency === 'weekly_weekends' && (day === 0 || day === 6)) count++;
        else if (frequency === 'weekly_sameday' && day === start.getDay()) count++;
        curr = addDays(curr, 1);
      }
      return Math.max(count, 1);
    } catch {
      return 1;
    }
  }, [selectedDate, endDate, frequency]);

  // Pricing calculation
  const hoursPerDay = selectedSlots.length;
  const totalHours = hoursPerDay * recurrenceCount;
  const pricePerHour = currentCourt.price_per_hour || 300;
  const totalAmount = totalHours * pricePerHour;

  // Toggle slot selection
  const toggleSlot = (slot: string) => {
    if (bookedSlots.includes(slot)) return;
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
        frequency,
        repeatUntil: frequency !== 'one-time' ? endDate : null,
        pricePerHour,
        totalAmount,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete booking');
      }

      // Success! Open confirmation modal
      setSuccessModalData({
        ...data.booking,
        courtName: currentCourt.name,
        surfaceType: currentCourt.surface_type,
        slots: selectedSlots,
      });

      // Refresh availability
      fetchBookedSlots();

      // Reset selection
      setSelectedSlots([]);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while creating your booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-stack-lg bg-surface-container-low border-y border-outline-variant/30" id="book-court">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/15 text-[#10B981] font-label-sm text-label-sm font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
            Live Slot Booking • Supabase Synced
          </div>
          <h2 className="font-headline-lg text-headline-lg text-[#0F172A]">
            Reserve Your Badminton Court
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Select your preferred date, court surface, and time slots below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Selection Controls */}
          <div className="lg:col-span-2 space-y-8">
            {/* Step 1: Date Selector */}
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/50 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-title-md text-title-md font-bold text-[#0F172A] flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-[#0F172A] text-white text-xs flex items-center justify-center font-bold">1</span>
                  Select Date
                </h3>

                {/* Quick Date Presets */}
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedDate(todayStr)}
                    className={`px-3 py-1 rounded-md font-medium border transition-colors ${
                      selectedDate === todayStr
                        ? 'bg-[#2563EB] text-white border-[#2563EB]'
                        : 'bg-surface border-outline-variant/60 hover:bg-surface-container-high'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'))}
                    className={`px-3 py-1 rounded-md font-medium border transition-colors ${
                      selectedDate === format(addDays(new Date(), 1), 'yyyy-MM-dd')
                        ? 'bg-[#2563EB] text-white border-[#2563EB]'
                        : 'bg-surface border-outline-variant/60 hover:bg-surface-container-high'
                    }`}
                  >
                    Tomorrow
                  </button>
                </div>
              </div>

              <div className="relative max-w-md">
                <label
                  htmlFor="booking-date-picker"
                  className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider"
                >
                  Choose your preferred date
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    calendar_today
                  </span>
                  <input
                    type="date"
                    id="booking-date-picker"
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant/50 rounded-lg font-title-md text-[#0F172A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all cursor-pointer font-semibold"
                  />
                </div>
                <p className="mt-2 font-label-sm text-label-sm text-on-surface-variant">
                  Available court slots update automatically based on your date selection.
                </p>
              </div>
            </div>

            {/* Step 1.5: Recurring Booking */}
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/50 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-title-md text-title-md font-bold text-[#0F172A] flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-[#0F172A] text-white text-xs flex items-center justify-center font-bold">1.5</span>
                  Recurring Booking
                </h3>
              </div>

              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFrequency('one-time')}
                    className={`frequency-btn px-4 py-2 rounded-full font-label-md text-label-md transition-colors ${
                      frequency === 'one-time'
                        ? 'bg-[#2563EB] text-white border border-[#2563EB] shadow-sm'
                        : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/50 hover:border-[#2563EB]'
                    }`}
                  >
                    One-time
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrequency('daily')}
                    className={`frequency-btn px-4 py-2 rounded-full font-label-md text-label-md transition-colors ${
                      frequency === 'daily'
                        ? 'bg-[#2563EB] text-white border border-[#2563EB] shadow-sm'
                        : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/50 hover:border-[#2563EB]'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrequency('weekly_weekends')}
                    className={`frequency-btn px-4 py-2 rounded-full font-label-md text-label-md transition-colors ${
                      frequency === 'weekly_weekends'
                        ? 'bg-[#2563EB] text-white border border-[#2563EB] shadow-sm'
                        : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/50 hover:border-[#2563EB]'
                    }`}
                  >
                    Weekly (Weekends only)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrequency('weekly_sameday')}
                    className={`frequency-btn px-4 py-2 rounded-full font-label-md text-label-md transition-colors ${
                      frequency === 'weekly_sameday'
                        ? 'bg-[#2563EB] text-white border border-[#2563EB] shadow-sm'
                        : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/50 hover:border-[#2563EB]'
                    }`}
                  >
                    Weekly (Same day)
                  </button>
                </div>

                {frequency !== 'one-time' && (
                  <div className="pt-4 border-t border-outline-variant/30 animate-in fade-in">
                    <label
                      className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider font-semibold"
                      htmlFor="end-date"
                    >
                      Repeat Until (End Date)
                    </label>
                    <div className="max-w-xs">
                      <input
                        className="w-full bg-surface border border-outline-variant/50 rounded-lg px-3 py-2 font-body-md text-body-md text-[#0F172A] placeholder-outline font-semibold"
                        id="end-date"
                        type="date"
                        min={selectedDate}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                    <p className="mt-2 font-label-sm text-label-sm text-[#2563EB] font-medium">
                      Booking will repeat across {recurrenceCount} session{recurrenceCount > 1 ? 's' : ''}.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Court Selector */}
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/50 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <h3 className="font-title-md text-title-md font-bold text-[#0F172A] flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-[#0F172A] text-white text-xs flex items-center justify-center font-bold">2</span>
                  Select Court
                </h3>

                <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container rounded-lg text-xs font-semibold text-[#0F172A]">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                  10 BWF Synthetic Courts • ₹300/hr
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {courts.map((court) => {
                  const isSelected = court.id === selectedCourtId;
                  return (
                    <button
                      key={court.id}
                      type="button"
                      onClick={() => {
                        setSelectedCourtId(court.id);
                        setSelectedSlots([]); // Clear slots on court change
                      }}
                      className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-md scale-102 ring-2 ring-[#2563EB]/40'
                          : 'bg-surface text-on-surface border-outline-variant/50 hover:border-[#2563EB] hover:bg-surface-container'
                      }`}
                    >
                      <span className="font-label-md text-label-md font-bold">{court.name}</span>
                      <span
                        className={`text-[10px] uppercase tracking-wider mt-1 px-1.5 py-0.5 rounded font-semibold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-[#2563EB]/15 text-[#2563EB]'
                        }`}
                      >
                        Synthetic
                      </span>
                      <span className={`text-[11px] mt-1 font-semibold ${isSelected ? 'text-white/80' : 'text-on-surface-variant'}`}>
                        ₹{court.price_per_hour || 300}/hr
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Time Slots */}
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/50 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <h3 className="font-title-md text-title-md font-bold text-[#0F172A] flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-[#0F172A] text-white text-xs flex items-center justify-center font-bold">3</span>
                  Select Time Slots
                </h3>

                {/* Legend */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 font-label-sm text-xs text-on-surface-variant font-medium">
                    <div className="w-3.5 h-3.5 rounded bg-[#10B981]/20 border border-[#10B981]/40"></div>
                    Available
                  </div>
                  <div className="flex items-center gap-1.5 font-label-sm text-xs text-on-surface-variant font-medium">
                    <div className="w-3.5 h-3.5 rounded bg-[#0F172A]"></div>
                    Selected
                  </div>
                  <div className="flex items-center gap-1.5 font-label-sm text-xs text-on-surface-variant font-medium">
                    <div className="w-3.5 h-3.5 rounded bg-[#F1F5F9] border border-[#E2E8F0]"></div>
                    Booked
                  </div>
                </div>
              </div>

              {loadingSlots ? (
                <div className="py-8 text-center text-on-surface-variant text-sm flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Updating court availability...
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Morning Slots */}
                  <div>
                    <h4 className="font-label-sm text-xs text-on-surface-variant mb-2.5 uppercase tracking-wider font-semibold">
                      Morning (6:00 AM – 12:00 PM)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {MORNING_SLOTS.map((slot) => {
                        const isBooked = bookedSlots.includes(slot);
                        const isSelected = selectedSlots.includes(slot);

                        let slotClass = 'court-slot available';
                        if (isBooked) slotClass = 'court-slot booked';
                        else if (isSelected) slotClass = 'court-slot selected';

                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isBooked}
                            onClick={() => toggleSlot(slot)}
                            className={`${slotClass} px-3.5 py-2.5 rounded-lg font-label-md text-sm min-w-[85px] font-semibold text-center`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Afternoon / Evening Slots */}
                  <div className="pt-3 border-t border-outline-variant/30">
                    <h4 className="font-label-sm text-xs text-on-surface-variant mb-2.5 uppercase tracking-wider font-semibold">
                      Afternoon &amp; Evening (12:00 PM – 12:00 AM)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {AFTERNOON_EVENING_SLOTS.map((slot) => {
                        const isBooked = bookedSlots.includes(slot);
                        const isSelected = selectedSlots.includes(slot);

                        let slotClass = 'court-slot available';
                        if (isBooked) slotClass = 'court-slot booked';
                        else if (isSelected) slotClass = 'court-slot selected';

                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isBooked}
                            onClick={() => toggleSlot(slot)}
                            className={`${slotClass} px-3.5 py-2.5 rounded-lg font-label-md text-sm min-w-[85px] font-semibold text-center`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Booking Summary Sticky Card */}
          <div className="lg:col-span-1">
            <div className="bg-surface-container-lowest rounded-xl border border-[#2563EB]/20 shadow-[0_8px_30px_rgba(37,99,235,0.08)] sticky top-28 overflow-hidden">
              <div className="bg-[#0F172A] p-6 text-white">
                <h3 className="font-title-md text-title-md font-bold mb-1">Booking Summary</h3>
                <p className="font-label-sm text-xs opacity-80">
                  Review your court &amp; schedule
                </p>
              </div>

              <div className="p-6 space-y-4">
                {/* Court & Date Info */}
                <div className="flex justify-between items-start pb-4 border-b border-outline-variant/30">
                  <div>
                    <p className="font-label-md text-label-md text-[#0F172A] font-bold">
                      {formattedSummaryDate}
                    </p>
                    <p className="font-label-sm text-xs text-on-surface-variant font-medium">
                      {currentCourt.name} ({currentCourt.surface_type})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-label-md text-sm text-[#0F172A] font-semibold">
                      {selectedSlots.length > 0
                        ? `${selectedSlots.length} Hour${selectedSlots.length > 1 ? 's' : ''}`
                        : 'No slot'}
                    </p>
                    <p className="font-label-sm text-xs text-[#2563EB] font-bold">
                      {selectedSlots.length > 0 ? selectedSlots[0] : 'Choose time'}
                    </p>
                  </div>
                </div>

                {/* Frequency */}
                <div className="flex justify-between items-center py-2 border-b border-outline-variant/10 text-sm">
                  <span className="text-on-surface-variant">Frequency</span>
                  <span className="font-semibold text-[#0F172A] capitalize">
                    {frequency.replace('_', ' ')}
                    {frequency !== 'one-time' && ` (${recurrenceCount} days)`}
                  </span>
                </div>

                {/* Court Fee */}
                <div className="flex justify-between items-center py-2 text-sm">
                  <span className="text-on-surface-variant">
                    Court Fee (₹{pricePerHour}/hr × {totalHours}h)
                  </span>
                  <span className="font-semibold text-[#0F172A]">₹{totalAmount}</span>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center py-3 bg-surface-container px-4 rounded-xl">
                  <span className="font-title-md text-title-md font-bold text-[#0F172A]">Total Amount</span>
                  <span className="font-headline-lg text-[26px] font-bold text-[#0F172A]">
                    ₹{totalAmount}
                  </span>
                </div>

                {/* Booking Form */}
                <form onSubmit={handleBookingSubmit} className="space-y-4 pt-3 mt-3 border-t border-outline-variant/30">
                  {errorMessage && (
                    <div className="p-3 rounded-lg bg-[#FFDAD6] text-[#93000A] text-xs font-semibold">
                      {errorMessage}
                    </div>
                  )}

                  <div>
                    <label className="block font-label-sm text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1" htmlFor="name">
                      Full Name
                    </label>
                    <input
                      className="w-full bg-surface border border-outline-variant/60 rounded-lg px-3 py-2.5 font-body-md text-sm text-[#0F172A] placeholder-outline"
                      id="name"
                      placeholder="Enter your name"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block font-label-sm text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1" htmlFor="phone">
                      Phone Number
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 bg-surface-container border border-r-0 border-outline-variant/60 rounded-l-lg font-body-md text-sm font-semibold text-on-surface-variant">
                        +91
                      </span>
                      <input
                        className="flex-1 bg-surface border border-outline-variant/60 rounded-r-lg px-3 py-2.5 font-body-md text-sm text-[#0F172A] placeholder-outline"
                        id="phone"
                        placeholder="10-digit number"
                        type="tel"
                        maxLength={10}
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                  </div>

                  <button
                    className="w-full mt-4 flex items-center justify-center gap-2 text-white font-label-md text-label-md py-3.5 px-4 rounded-xl transition-all shadow-md bg-[#0F172A] hover:bg-[#2563EB] hover:shadow-lg active:scale-98 disabled:opacity-60 font-bold"
                    type="submit"
                    disabled={isSubmitting || selectedSlots.length === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin text-sm">⌛</span> Reserving Slots...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[20px]">sports_tennis</span>
                        Confirm &amp; Book Court
                      </>
                    )}
                  </button>

                  <button
                    className="w-full mt-2 flex items-center justify-center gap-2 text-on-surface-variant font-label-md text-xs py-2.5 px-4 rounded-lg border border-outline-variant/50 hover:bg-surface-container-high hover:text-[#BA1A1A] transition-colors"
                    type="button"
                    onClick={() => setCancelModalOpen(true)}
                  >
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    Cancel existing booking
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <BookingSuccessModal
        isOpen={Boolean(successModalData)}
        onClose={() => setSuccessModalData(null)}
        bookingData={successModalData}
      />

      {/* Cancel Existing Booking Modal */}
      <CancelBookingModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onBookingCancelled={fetchBookedSlots}
      />
    </section>
  );
}
