'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface BookingSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: {
    booking_code: string;
    customer_name: string;
    customer_phone: string;
    booking_date: string;
    frequency: string;
    total_hours: number;
    total_amount: number;
    courtName?: string;
    surfaceType?: string;
    slots: string[];
    dates?: string[];
  } | null;
}

export default function BookingSuccessModal({
  isOpen,
  onClose,
  bookingData,
}: BookingSuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Fire celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563EB', '#10B981', '#0F172A', '#F59E0B'],
      });
    }
  }, [isOpen]);

  if (!isOpen || !bookingData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-outline-variant relative overflow-hidden">
        {/* Top decorative accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#2563EB] via-[#10B981] to-[#0F172A]" />

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#10B981]/15 text-[#10B981] rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-[36px]">check_circle</span>
          </div>
          <h3 className="font-headline-lg text-[24px] font-bold text-[#0F172A]">
            Court Booking Confirmed!
          </h3>
          <p className="font-body-md text-sm text-on-surface-variant mt-1">
            Your slot has been successfully reserved in our system.
          </p>
        </div>

        {/* Receipt Box */}
        <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/60 space-y-3 mb-6">
          <div className="flex justify-between items-center pb-3 border-b border-outline-variant/30">
            <span className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
              Booking Code
            </span>
            <span className="px-3 py-1 bg-[#0F172A] text-white text-sm font-mono font-bold rounded-md">
              {bookingData.booking_code}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-on-surface-variant">Player Name</p>
              <p className="font-semibold text-[#0F172A]">{bookingData.customer_name}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Phone</p>
              <p className="font-semibold text-[#0F172A]">+91 {bookingData.customer_phone}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Court</p>
              <p className="font-semibold text-[#0F172A]">
                {bookingData.courtName || 'Court'} ({bookingData.surfaceType || 'BWF'})
              </p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Date</p>
              <p className="font-semibold text-[#0F172A]">{bookingData.booking_date}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Booked Time Slots</p>
              <p className="font-semibold text-[#2563EB]">{bookingData.slots.join(', ')}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Total Amount</p>
              <p className="font-bold text-lg text-[#0F172A]">₹{bookingData.total_amount}</p>
            </div>
          </div>
        </div>

        {/* 10-Minute Late Forfeiture Warning */}
        <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#F59E0B]/50 mb-6 flex items-start gap-3 text-left shadow-sm">
          <div className="p-1.5 bg-[#FEF3C7] rounded-lg text-[#D97706] shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[20px] block">warning</span>
          </div>
          <div className="text-xs leading-relaxed text-[#92400E]">
            <p className="font-bold text-sm text-[#78350F] mb-1 flex items-center gap-1.5">
              ⚠️ Strict 10-Minute Arrival Rule
            </p>
            <p>
              Please arrive at the arena at least 10 minutes before your slot starts.
              <span className="font-bold text-[#B45309] block mt-1">
                If you are late by 10 minutes, your booking is forfeited and you will lose your slot.
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 px-4 rounded-lg border border-outline-variant font-label-md text-sm text-[#0F172A] hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Print / Save Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-lg bg-[#0F172A] text-white font-label-md text-sm hover:bg-[#2563EB] transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">done</span>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
