'use client';

import { useState } from 'react';

interface CancelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingCancelled?: () => void;
}

export default function CancelBookingModal({
  isOpen,
  onClose,
  onBookingCancelled,
}: CancelBookingModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[] | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setErrorMsg('Please enter your 10-digit phone number or booking code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setBookings(null);

    try {
      const isCode = searchQuery.toUpperCase().startsWith('GS-');
      const param = isCode
        ? `code=${encodeURIComponent(searchQuery.trim().toUpperCase())}`
        : `phone=${encodeURIComponent(searchQuery.trim())}`;

      const res = await fetch(`/api/cancel?${param}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to search bookings');
      }

      setBookings(data.bookings || []);
      if (data.bookings?.length === 0) {
        setErrorMsg('No active bookings found for the provided information.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error looking up bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking? This will immediately free up the reserved time slots.')) {
      return;
    }

    setCancellingId(bookingId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel booking');
      }

      setSuccessMsg('Booking cancelled successfully! The slots have been released.');
      // Update local state
      setBookings((prev) =>
        prev
          ? prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
          : []
      );
      if (onBookingCancelled) {
        onBookingCancelled();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error cancelling booking');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-outline-variant/40 mb-5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#BA1A1A]">cancel</span>
            <h3 className="font-title-md text-title-md font-bold text-[#0F172A]">
              Lookup &amp; Cancel Booking
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-[#0F172A] p-1 rounded-md"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-4 mb-6">
          <div>
            <label className="block font-label-sm text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
              Enter Phone Number or Booking Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. 9876543210 or GS-123456"
                className="flex-1 bg-surface border border-outline-variant/60 rounded-lg px-3 py-2.5 text-sm text-[#0F172A] focus:border-[#2563EB]"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-[#0F172A] text-white font-label-md text-sm rounded-lg hover:bg-[#2563EB] transition-colors disabled:opacity-60 flex items-center gap-1.5"
              >
                {loading ? (
                  <span className="animate-spin text-xs">⌛</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">search</span>
                )}
                Find
              </button>
            </div>
          </div>
        </form>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-lg bg-[#FFDAD6] text-[#93000A] text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 rounded-lg bg-[#E6F4EA] text-[#137333] text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {successMsg}
          </div>
        )}

        {/* Bookings List */}
        {bookings && (
          <div className="space-y-3">
            <h4 className="font-label-md text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
              Found Bookings ({bookings.length})
            </h4>

            {bookings.length === 0 ? (
              <p className="text-sm text-on-surface-variant italic py-4 text-center">
                No matching records found.
              </p>
            ) : (
              bookings.map((booking) => {
                const isCancelled = booking.status === 'cancelled';
                const slots = booking.booking_slots
                  ?.map((s: any) => s.slot_time)
                  .join(', ') || 'N/A';

                return (
                  <div
                    key={booking.id}
                    className={`p-4 rounded-xl border ${
                      isCancelled
                        ? 'bg-surface-container-high/40 border-outline-variant/40 opacity-75'
                        : 'bg-surface-container-lowest border-outline-variant'
                    } flex flex-col gap-2`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-xs bg-[#0F172A] text-white px-2.5 py-0.5 rounded">
                        {booking.booking_code}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                          isCancelled
                            ? 'bg-[#FFDAD6] text-[#BA1A1A]'
                            : 'bg-[#10B981]/15 text-[#10B981]'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-on-surface-variant pt-1">
                      <div>
                        <span className="font-medium text-[#0F172A]">Date:</span>{' '}
                        {booking.booking_date}
                      </div>
                      <div>
                        <span className="font-medium text-[#0F172A]">Court:</span>{' '}
                        {booking.court?.name || 'Court 1'}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium text-[#0F172A]">Slots:</span> {slots}
                      </div>
                      <div>
                        <span className="font-medium text-[#0F172A]">Total:</span> ₹
                        {booking.total_amount}
                      </div>
                    </div>

                    {!isCancelled && (
                      <div className="pt-2 mt-1 border-t border-outline-variant/30 flex justify-end">
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="px-3 py-1.5 bg-[#BA1A1A] hover:bg-[#93000A] text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1 disabled:opacity-60"
                        >
                          {cancellingId === booking.id ? 'Cancelling...' : 'Cancel This Booking'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
