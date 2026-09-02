'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, parseISO } from 'date-fns';

interface PricingRule {
  id: string;
  rule_name: string;
  start_hour: number;
  end_hour: number;
  price_per_hour: number;
  court_scope: 'ALL' | 'CUSTOM';
  is_active: boolean;
}

interface BlockedSlot {
  id: string;
  court_number: number;
  block_date: string;
  start_hour: number;
  end_hour: number;
  reason: string;
}

interface PromoBannerData {
  enabled: boolean;
  badge: string;
  headline: string;
  message: string;
  ctaText: string;
}

const TIME_ROWS = [
  { label: '6-7 AM', hour: 6, display: '06:00 AM' },
  { label: '7-8 AM', hour: 7, display: '07:00 AM' },
  { label: '8-9 AM', hour: 8, display: '08:00 AM' },
  { label: '9-10 AM', hour: 9, display: '09:00 AM' },
  { label: '10-11 AM', hour: 10, display: '10:00 AM' },
  { label: '11 AM-12 PM', hour: 11, display: '11:00 AM' },
  { label: '12-1 PM', hour: 12, display: '12:00 PM' },
  { label: '1-2 PM', hour: 13, display: '01:00 PM' },
  { label: '2-3 PM', hour: 14, display: '02:00 PM' },
  { label: '3-4 PM', hour: 15, display: '03:00 PM' },
  { label: '4-5 PM', hour: 16, display: '04:00 PM' },
  { label: '5-6 PM', hour: 17, display: '05:00 PM' },
  { label: '6-7 PM', hour: 18, display: '06:00 PM' },
  { label: '7-8 PM', hour: 19, display: '07:00 PM' },
  { label: '8-9 PM', hour: 20, display: '08:00 PM' },
  { label: '9-10 PM', hour: 21, display: '09:00 PM' },
  { label: '10-11 PM', hour: 22, display: '10:00 PM' },
  { label: '11 PM-12 AM', hour: 23, display: '11:00 PM' },
];

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>('gurukulssportsblr@gmail.com');
  const [loginPass, setLoginPass] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [promoBanner, setPromoBanner] = useState<PromoBannerData>({
    enabled: false,
    badge: '🎉 SPECIAL OFFER',
    headline: 'Special Discounts Available on Badminton Courts!',
    message: "Enjoy international standard BWF Synthetic courts at Gurukul's Sports Academy Thubrahalli.",
    ctaText: 'Claim Offer & Book Court',
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [activeModal, setActiveModal] = useState<'none' | 'pricing' | 'promo' | 'block' | 'walkin'>('none');

  // Forms state
  const [newRuleName, setNewRuleName] = useState('Morning Happy Hours');
  const [newRulePrice, setNewRulePrice] = useState(200);
  const [newRuleStart, setNewRuleStart] = useState(6);
  const [newRuleEnd, setNewRuleEnd] = useState(15);
  const [newRuleScope, setNewRuleScope] = useState<'ALL' | 'CUSTOM'>('ALL');

  const [blockCourtNum, setBlockCourtNum] = useState<number>(0);
  const [blockReason, setBlockReason] = useState('Court Maintenance');
  const [blockCustomReason, setBlockCustomReason] = useState('');
  const [blockAllDates, setBlockAllDates] = useState(false);
  const [blockStart, setBlockStart] = useState(6);
  const [blockEnd, setBlockEnd] = useState(24);

  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinCourt, setWalkinCourt] = useState(1);
  const [walkinSlot, setWalkinSlot] = useState('06:00 AM');

  // Check login on mount
  useEffect(() => {
    const auth = sessionStorage.getItem('gs_admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail.trim() === 'gurukulssportsblr@gmail.com' && loginPass.trim() === 'G#r#kul$Sp0rt$@blr') {
      sessionStorage.setItem('gs_admin_auth', 'true');
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid email or password.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('gs_admin_auth');
    setIsAuthenticated(false);
  };

  // Fetch all live operational data from backend APIs
  const fetchDashboardData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [bookingsRes, rulesRes, blocksRes, promoRes] = await Promise.all([
        fetch(`/api/bookings?allCourts=true&date=${selectedDate}`),
        fetch('/api/pricing-rules'),
        fetch(`/api/blocked-slots?date=${selectedDate}`),
        fetch('/api/promo-banner'),
      ]);

      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setAllBookings(data.allBookings || []);
      }
      if (rulesRes.ok) {
        const data = await rulesRes.json();
        setPricingRules(data.rules || []);
      }
      if (blocksRes.ok) {
        const data = await blocksRes.json();
        setBlockedSlots(data.blocks || []);
      }
      if (promoRes.ok) {
        const data = await promoRes.json();
        if (data.banner) setPromoBanner(data.banner);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();

      const handleFocus = () => fetchDashboardData(true);
      window.addEventListener('focus', handleFocus);
      const interval = setInterval(() => fetchDashboardData(true), 8000);

      return () => {
        window.removeEventListener('focus', handleFocus);
        clearInterval(interval);
      };
    }
  }, [isAuthenticated, fetchDashboardData]);

  // Day Name Computation
  const dayName = useMemo(() => {
    try {
      const dateObj = parseISO(selectedDate);
      return format(dateObj, 'EEEE');
    } catch {
      return 'Today';
    }
  }, [selectedDate]);

  // Pricing helper
  const getSlotPrice = useCallback(
    (courtNum: number, hour: number) => {
      let price = 300;
      let isDiscounted = false;
      let ruleName = '';

      for (const rule of pricingRules) {
        if (!rule.is_active) continue;
        if (hour >= rule.start_hour && hour < rule.end_hour) {
          if (rule.court_scope === 'ALL' || (rule.court_scope === 'CUSTOM' && courtNum <= 5)) {
            price = Number(rule.price_per_hour);
            isDiscounted = price < 300;
            ruleName = rule.rule_name;
            break;
          }
        }
      }
      return { price, isDiscounted, ruleName };
    },
    [pricingRules]
  );

  // Click Cell in Matrix -> Open Walk-in Modal with court & slot pre-selected
  const handleCellClick = (courtNum: number, slotDisplay: string) => {
    setWalkinCourt(courtNum);
    setWalkinSlot(slotDisplay);
    setWalkinName('');
    setWalkinPhone('');
    setActiveModal('walkin');
  };

  // Cancel Slot Booking
  const handleCancelBooking = async (bookingId: string, courtNum: number, slotTime: string) => {
    if (!window.confirm(`Cancel booking for Court ${courtNum} at ${slotTime}? This will immediately free the slot for customers.`)) return;

    try {
      const res = await fetch('/api/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      if (res.ok) {
        alert('✅ Booking cancelled. The slot is now available on the website.');
        fetchDashboardData();
      } else {
        const d = await res.json();
        alert(`❌ Error: ${d.error || 'Could not cancel booking'}`);
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    }
  };

  // Unblock Slot
  const handleUnblock = async (blockId: string) => {
    if (!window.confirm('Remove this court block?')) return;
    try {
      const res = await fetch(`/api/blocked-slots?id=${blockId}`, { method: 'DELETE' });
      if (res.ok) {
        alert('✅ Court unblocked successfully.');
        fetchDashboardData();
      }
    } catch (err: any) {
      alert(`Error unblocking: ${err.message}`);
    }
  };

  // Save Pricing Rule
  const handleSavePricingRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newRuleStart >= newRuleEnd) {
      alert('Start time must be earlier than End time.');
      return;
    }

    try {
      const res = await fetch('/api/pricing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_name: newRuleName.trim(),
          start_hour: newRuleStart,
          end_hour: newRuleEnd,
          price_per_hour: newRulePrice,
          court_scope: newRuleScope,
          is_active: true,
        }),
      });

      if (res.ok) {
        alert('✅ Pricing rule saved & applied to the timetable and customer website!');
        setActiveModal('none');
        fetchDashboardData();
      }
    } catch (err: any) {
      alert(`Error saving pricing rule: ${err.message}`);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!window.confirm('Delete this pricing rule?')) return;
    try {
      await fetch(`/api/pricing-rules?id=${id}`, { method: 'DELETE' });
      fetchDashboardData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Save Promo Banner
  const handleSavePromoBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/promo-banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promoBanner),
      });

      if (res.ok) {
        alert('🎉 Promotional Announcement published to live customer website!');
        setActiveModal('none');
        fetchDashboardData();
      }
    } catch (err: any) {
      alert(`Error publishing banner: ${err.message}`);
    }
  };

  // Block Court Submit
  const handleBlockCourtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blockStart >= blockEnd) {
      alert('From time must be earlier than To time.');
      return;
    }

    const finalReason = blockReason === 'Custom' ? (blockCustomReason.trim() || 'Court Maintenance') : blockReason;

    try {
      const res = await fetch('/api/blocked-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          court_number: blockCourtNum,
          block_date: blockAllDates ? 'ALL' : selectedDate,
          start_hour: blockStart,
          end_hour: blockEnd,
          reason: finalReason,
        }),
      });

      if (res.ok) {
        alert(`⚠️ Court(s) successfully blocked for ${finalReason}!`);
        setActiveModal('none');
        fetchDashboardData();
      }
    } catch (err: any) {
      alert(`Error blocking court: ${err.message}`);
    }
  };

  // Walkin Submit
  const handleWalkinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: `c${walkinCourt}`,
          customerName: walkinName.trim(),
          customerPhone: walkinPhone.trim().replace(/\D/g, ''),
          bookingDate: selectedDate,
          selectedSlots: [walkinSlot],
        }),
      });

      if (res.ok) {
        alert('✅ Walk-in booking confirmed successfully!');
        setWalkinName('');
        setWalkinPhone('');
        setActiveModal('none');
        fetchDashboardData();
      } else {
        const d = await res.json();
        alert(`❌ Error: ${d.error || 'Failed to book'}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Total booked calculation for KPI
  const totalBookedCount = allBookings.length;
  const occupancyPercentage = Math.round((totalBookedCount / 198) * 100);
  const totalRevenue = allBookings.reduce((sum, b) => {
    const hour = TIME_ROWS.find((t) => t.display === b.slot_time)?.hour || 6;
    return sum + getSlotPrice(b.court_number, hour).price;
  }, 0);

  // If not authenticated, render gated login
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A] p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-emerald-500 to-slate-900"></div>

          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
            <span className="material-symbols-outlined text-[32px]">sports_tennis</span>
          </div>

          <h2 className="font-heading font-extrabold text-2xl text-slate-900">Host Control Portal</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">Gurukul's Sports Academy Thubrahalli</p>

          {loginError && (
            <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs font-semibold text-left flex items-center gap-2 border border-red-200">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Official Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-slate-900 hover:bg-blue-600 text-white font-heading font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-2"
            >
              <span className="material-symbols-outlined text-[18px]">lock_open</span>
              Unlock Host Control Panel
            </button>
          </form>

          <p className="text-[11px] text-slate-400 mt-6 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[14px]">shield</span>
            Authorized Arena Staff Only • 256-Bit Encrypted
          </p>
        </div>
      </div>
    );
  }

  // Render main Host Control Matrix
  return (
    <div className="bg-[#F8FAFC] text-[#0F172A] min-h-screen font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-[1700px] mx-auto px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-emerald-400 font-extrabold">
              <span className="material-symbols-outlined text-[24px]">sports_tennis</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-extrabold text-lg tracking-tight uppercase">
                  GURUKUL'S SPORTS ACADEMY THUBRAHALLI
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live Register
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                11 BWF Synthetic Badminton Courts • Arena Operations Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => setActiveModal('pricing')}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">percent</span>
              Slot Pricing &amp; Discounts
            </button>

            <button
              onClick={() => setActiveModal('promo')}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">campaign</span>
              Promo Banner &amp; Pop-up
            </button>

            <button
              onClick={() => setActiveModal('block')}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">block</span>
              Block Courts (Maintenance)
            </button>

            <button
              onClick={() => setActiveModal('walkin')}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg border border-white/20 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              + Walk-in Booking
            </button>

            <div className="h-6 w-[1px] bg-slate-700 mx-1"></div>

            <a
              href="/"
              target="_blank"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              Customer Site
            </a>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 bg-red-900/40 hover:bg-red-800 text-red-300 rounded-lg transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Date & Day Header Bar (Matching format.png) */}
      <section className="bg-white border-b border-slate-200 sticky top-[69px] z-30 shadow-sm">
        <div className="max-w-[1700px] mx-auto px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => {
                  const curr = new Date(selectedDate);
                  curr.setDate(curr.getDate() - 1);
                  setSelectedDate(format(curr, 'yyyy-MM-dd'));
                }}
                className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition-colors"
                title="Previous Day"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <button
                onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs rounded-lg shadow-sm border border-slate-200 transition-all"
              >
                Today
              </button>
              <button
                onClick={() => {
                  const curr = new Date(selectedDate);
                  curr.setDate(curr.getDate() + 1);
                  setSelectedDate(format(curr, 'yyyy-MM-dd'));
                }}
                className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition-colors"
                title="Next Day"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-sm text-slate-500 uppercase">DATE:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 cursor-pointer outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="font-heading font-extrabold text-xs text-blue-700 uppercase">DAY:</span>
              <span className="font-mono font-bold text-sm text-blue-900">{dayName}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600"></span>
              <span className="text-slate-600">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 border border-blue-600"></span>
              <span className="text-slate-600">⚡ Discounted Slot</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-900 border border-slate-800"></span>
              <span className="text-slate-600">Booked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600"></span>
              <span className="text-slate-600">⚠️ Blocked / Maint.</span>
            </div>

            <button
              onClick={() => window.print()}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              Print
            </button>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <main className="max-w-[1700px] mx-auto px-4 lg:px-8 py-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Booked Slots</p>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="font-heading font-extrabold text-2xl text-slate-900">{totalBookedCount}</h3>
              <span className="text-xs text-slate-400 font-medium">/ 198 total</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Day's Revenue</p>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="font-heading font-extrabold text-2xl text-emerald-600">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                LIVE
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Occupancy Rate</p>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="font-heading font-extrabold text-2xl text-blue-600">{occupancyPercentage}%</h3>
              <span className="text-xs text-slate-400 font-medium">Peak: 6-10 PM</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Pricing Rules</p>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="font-heading font-extrabold text-2xl text-amber-600">
                {pricingRules.filter((r) => r.is_active).length}
              </h3>
              <span
                className="text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-semibold cursor-pointer hover:underline"
                onClick={() => setActiveModal('pricing')}
              >
                Configure
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Promo Banner</p>
            <div className="flex items-baseline justify-between mt-1">
              <h3
                className={`font-heading font-extrabold text-lg ${
                  promoBanner.enabled ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {promoBanner.enabled ? 'ACTIVE' : 'DISABLED'}
              </h3>
              <span
                className="text-xs text-slate-400 font-medium cursor-pointer hover:underline"
                onClick={() => setActiveModal('promo')}
              >
                Edit
              </span>
            </div>
          </div>
        </div>

        {/* 11-Court Register Table Matrix */}
        <div className="bg-white rounded-2xl border border-slate-300 shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <span className="animate-spin text-2xl">⏳</span>
              <p className="mt-2 text-sm font-semibold">Synchronizing with live database...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs text-left">
                <thead>
                  <tr className="bg-slate-900 text-white font-heading font-bold text-center uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <th className="py-3 px-2 border-r border-slate-700 min-w-[100px] !bg-slate-950 !text-amber-400 sticky left-0 z-20">
                      TIME:
                    </th>
                    <th className="py-3 px-2 border-r border-slate-700 min-w-[125px]">COURT NO 1</th>
                    <th className="py-3 px-2 border-r border-slate-700 min-w-[125px]">COURT NO 2</th>
                    <th className="py-3 px-2 border-r border-slate-700 min-w-[125px]">COURT NO 3</th>
                    <th className="py-3 px-2 border-r border-slate-700 min-w-[125px]">COURT NO 4</th>
                    <th className="py-3 px-2 border-r border-slate-700 min-w-[125px]">COURT NO 5</th>
                    <th className="py-3 px-2 border-r border-slate-700 min-w-[100px] !bg-slate-950 !text-amber-400">
                      TIME:
                    </th>
                    <th className="py-3 px-2 border-r border-slate-700 min-w-[125px]">COURT NO 6</th>
                    <th className="py-3 px-2 border-r border-slate-700 min-w-[125px]">COURT NO 7</th>
                    <th className="py-3 px-2 border-r border-slate-700 min-w-[125px]">COURT NO 8</th>
                    <th className="py-3 px-2 border-r border-slate-700 min-w-[125px]">COURT NO 9</th>
                    <th className="py-3 px-2 border-r border-slate-700 min-w-[125px]">COURT NO 10</th>
                    <th className="py-3 px-2 min-w-[125px]">COURT NO 11</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {TIME_ROWS.map((row) => {
                    const renderCourtCell = (courtNum: number) => {
                      const { price, isDiscounted } = getSlotPrice(courtNum, row.hour);

                      // Check if blocked
                      const blockMatch = blockedSlots.find(
                        (b) =>
                          (b.block_date === selectedDate || b.block_date === 'ALL') &&
                          (b.court_number === 0 || b.court_number === courtNum) &&
                          row.hour >= b.start_hour &&
                          row.hour < b.end_hour
                      );

                      if (blockMatch) {
                        return (
                          <td key={courtNum} className="p-1 border-r border-slate-200 bg-amber-50/80">
                            <div className="w-full h-12 rounded-lg bg-amber-100 border border-amber-300 p-1 flex flex-col justify-between text-center relative group">
                              <span className="font-bold text-[10px] text-amber-900 uppercase tracking-tight flex items-center justify-center gap-0.5">
                                ⚠️ Blocked
                              </span>
                              <div className="flex justify-between items-center text-[9px] text-amber-800">
                                <span className="truncate">{blockMatch.reason}</span>
                                <button
                                  onClick={() => handleUnblock(blockMatch.id)}
                                  title="Unblock this court"
                                  className="text-red-600 hover:underline font-extrabold"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      // Check if booked
                      const booking = allBookings.find(
                        (b) => b.court_number === courtNum && b.slot_time === row.display
                      );

                      if (booking) {
                        return (
                          <td key={courtNum} className="p-1 border-r border-slate-200">
                            <div className="w-full h-12 rounded-lg bg-slate-900 text-white p-1.5 flex flex-col justify-between shadow-sm">
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-[11px] truncate text-slate-100">
                                  {booking.customer_name}
                                </span>
                                <span className="text-[9px] font-mono text-emerald-400 font-bold">
                                  ₹{price}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[9px] text-slate-400">
                                <span className="truncate">{booking.customer_phone}</span>
                                <button
                                  onClick={() =>
                                    handleCancelBooking(
                                      booking.booking_id || booking.id,
                                      courtNum,
                                      row.display
                                    )
                                  }
                                  title="Cancel Booking & Free Slot"
                                  className="text-red-400 hover:text-red-300 font-bold hover:underline"
                                >
                                  ✕ Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      // Available Slot
                      return (
                        <td
                          key={courtNum}
                          className="p-1 border-r border-slate-200 cursor-pointer group"
                          onClick={() => handleCellClick(courtNum, row.display)}
                        >
                          <div
                            className={`w-full h-12 rounded-lg p-1.5 flex flex-col justify-between transition-all ${
                              isDiscounted
                                ? 'bg-blue-50/70 border border-blue-200 group-hover:bg-blue-100'
                                : 'bg-emerald-50/40 border border-slate-200 group-hover:bg-emerald-100/50'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span
                                className={`font-bold text-[10px] ${
                                  isDiscounted ? 'text-blue-700' : 'text-slate-500'
                                }`}
                              >
                                ₹{price}
                              </span>
                              {isDiscounted && (
                                <span className="text-[8px] bg-blue-600 text-white px-1 rounded font-extrabold uppercase">
                                  OFFER
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-400 group-hover:text-emerald-700 font-medium">
                              + Book
                            </span>
                          </div>
                        </td>
                      );
                    };

                    return (
                      <tr key={row.label} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2 px-2 font-mono font-bold text-center border-r border-slate-300 text-slate-900 text-xs bg-slate-100 sticky left-0 z-10">
                          {row.label}
                        </td>
                        {renderCourtCell(1)}
                        {renderCourtCell(2)}
                        {renderCourtCell(3)}
                        {renderCourtCell(4)}
                        {renderCourtCell(5)}
                        <td className="py-2 px-2 font-mono font-bold text-center border-r border-slate-300 text-slate-900 text-xs bg-slate-100">
                          {row.label}
                        </td>
                        {renderCourtCell(6)}
                        {renderCourtCell(7)}
                        {renderCourtCell(8)}
                        {renderCourtCell(9)}
                        {renderCourtCell(10)}
                        {renderCourtCell(11)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL 1: PRICING RULES */}
      {activeModal === 'pricing' && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <span className="material-symbols-outlined text-[24px]">percent</span>
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-lg text-slate-900">
                    Dynamic Slot Pricing &amp; Discounts
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure custom slot rates that immediately reflect on the website
                  </p>
                </div>
              </div>
              <button onClick={() => setActiveModal('none')} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePricingRule} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 mb-6">
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-700">
                Create New Pricing Rule
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rule Name</label>
                  <input
                    type="text"
                    required
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                    placeholder="e.g. Afternoon Discount"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discounted Rate (₹/hour)</label>
                  <input
                    type="number"
                    required
                    min="50"
                    max="1000"
                    step="10"
                    value={newRulePrice}
                    onChange={(e) => setNewRulePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Time Slot</label>
                  <select
                    value={newRuleStart}
                    onChange={(e) => setNewRuleStart(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                  >
                    <option value="6">06:00 AM</option>
                    <option value="7">07:00 AM</option>
                    <option value="8">08:00 AM</option>
                    <option value="9">09:00 AM</option>
                    <option value="10">10:00 AM</option>
                    <option value="11">11:00 AM</option>
                    <option value="12">12:00 PM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Time Slot</label>
                  <select
                    value={newRuleEnd}
                    onChange={(e) => setNewRuleEnd(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                  >
                    <option value="12">12:00 PM</option>
                    <option value="13">01:00 PM</option>
                    <option value="14">02:00 PM</option>
                    <option value="15">03:00 PM</option>
                    <option value="16">04:00 PM</option>
                    <option value="17">05:00 PM</option>
                    <option value="23">11:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Applicable Courts</label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800">
                    <input
                      type="radio"
                      name="courtScope"
                      checked={newRuleScope === 'ALL'}
                      onChange={() => setNewRuleScope('ALL')}
                    />{' '}
                    All 11 Courts
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800">
                    <input
                      type="radio"
                      name="courtScope"
                      checked={newRuleScope === 'CUSTOM'}
                      onChange={() => setNewRuleScope('CUSTOM')}
                    />{' '}
                    Courts 1–5 Only
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all shadow-sm"
              >
                Save &amp; Apply Pricing Rule
              </button>
            </form>

            {/* Active Rules List */}
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-600 mb-3">
              Active Pricing Rules
            </h4>
            <div className="space-y-2">
              {pricingRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{rule.rule_name}</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded">
                        ₹{rule.price_per_hour}/hr
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {rule.start_hour}:00 to {rule.end_hour}:00 •{' '}
                      {rule.court_scope === 'ALL' ? 'All 11 Courts' : 'Courts 1–5'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1 hover:bg-red-50 text-red-500 rounded font-bold text-xs"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PROMO BANNER */}
      {activeModal === 'promo' && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <span className="material-symbols-outlined text-[24px]">campaign</span>
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-lg text-slate-900">
                    Website Discount Banner &amp; Pop-up
                  </h3>
                  <p className="text-xs text-slate-500">
                    Publish live offers, discounts, and announcement pop-ups to visitors
                  </p>
                </div>
              </div>
              <button onClick={() => setActiveModal('none')} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePromoBanner} className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="font-bold text-sm text-slate-900">Enable Promotional Announcement</p>
                  <p className="text-xs text-slate-500">Show top banner &amp; welcome pop-up on website</p>
                </div>
                <input
                  type="checkbox"
                  checked={promoBanner.enabled}
                  onChange={(e) => setPromoBanner({ ...promoBanner, enabled: e.target.checked })}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Offer Tag / Badge</label>
                <input
                  type="text"
                  value={promoBanner.badge}
                  onChange={(e) => setPromoBanner({ ...promoBanner, badge: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-amber-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Headline Text</label>
                <input
                  type="text"
                  value={promoBanner.headline}
                  onChange={(e) => setPromoBanner({ ...promoBanner, headline: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Message</label>
                <textarea
                  rows={3}
                  value={promoBanner.message}
                  onChange={(e) => setPromoBanner({ ...promoBanner, message: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md"
                >
                  Publish to Live Website
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: BLOCK COURTS */}
      {activeModal === 'block' && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                  <span className="material-symbols-outlined text-[24px]">block</span>
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-lg text-slate-900">Block Courts (Maintenance / Events)</h3>
                  <p className="text-xs text-slate-500">Instantly prevent customer bookings on selected courts &amp; hours</p>
                </div>
              </div>
              <button onClick={() => setActiveModal('none')} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
                ✕
              </button>
            </div>

            <form onSubmit={handleBlockCourtSubmit} className="space-y-4 mb-6 pb-6 border-b border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Court(s)</label>
                  <select
                    value={blockCourtNum}
                    onChange={(e) => setBlockCourtNum(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    <option value="0">All 11 Courts</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => (
                      <option key={n} value={n}>
                        Court {n}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date Scope</label>
                  <select
                    value={blockAllDates ? 'ALL' : 'DATE'}
                    onChange={(e) => setBlockAllDates(e.target.value === 'ALL')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                  >
                    <option value="DATE">Selected Date Only ({selectedDate})</option>
                    <option value="ALL">All Dates (Indefinite Maintenance)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Blocking</label>
                <select
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                >
                  <option value="Court Maintenance">Court Mat Maintenance &amp; Cleaning</option>
                  <option value="State Tournament">State Badminton Tournament</option>
                  <option value="Academy Coaching Camp">Academy Coaching Camp</option>
                  <option value="Private Corporate Event">Private Corporate Event</option>
                  <option value="Floodlight &amp; Electrical Repair">Floodlight &amp; Electrical Repair</option>
                  <option value="Custom">Custom Reason (Type below)...</option>
                </select>
                {blockReason === 'Custom' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter custom blocking reason"
                    value={blockCustomReason}
                    onChange={(e) => setBlockCustomReason(e.target.value)}
                    className="w-full mt-2 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                  />
                )}
              </div>

              {/* Quick Time Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Quick Time Presets</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => { setBlockStart(6); setBlockEnd(24); }}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                      blockStart === 6 && blockEnd === 24
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Full Day (6 AM - 12 AM)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setBlockStart(6); setBlockEnd(12); }}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                      blockStart === 6 && blockEnd === 12
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Morning (6 AM - 12 PM)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setBlockStart(12); setBlockEnd(18); }}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                      blockStart === 12 && blockEnd === 18
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Afternoon (12 PM - 6 PM)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setBlockStart(18); setBlockEnd(23); }}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                      blockStart === 18 && blockEnd === 23
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Evening (6 PM - 11 PM)
                  </button>
                </div>
              </div>

              {/* Custom From & To Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">From Time Slot</label>
                  <select
                    value={blockStart}
                    onChange={(e) => setBlockStart(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                  >
                    {TIME_ROWS.map((row) => (
                      <option key={row.hour} value={row.hour}>
                        {row.display}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">To Time Slot</label>
                  <select
                    value={blockEnd}
                    onChange={(e) => setBlockEnd(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                  >
                    {TIME_ROWS.map((row) => (
                      <option key={row.hour + 1} value={row.hour + 1}>
                        {row.hour + 1 === 24
                          ? '12:00 AM (Midnight)'
                          : row.hour + 1 > 12
                          ? `${String(row.hour + 1 - 12).padStart(2, '0')}:00 PM`
                          : `${String(row.hour + 1).padStart(2, '0')}:00 AM`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg shadow-md mt-2 flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">lock</span>
                Apply Court Block (Live)
              </button>
            </form>

            {/* Currently Active Blocks List */}
            <div>
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-600 mb-3 flex items-center justify-between">
                <span>Active Court Blocks ({blockedSlots.length})</span>
                <span className="text-[10px] normal-case text-slate-400">Click Remove to unblock</span>
              </h4>

              {blockedSlots.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No active court blocks for this date. All courts are open for reservations.
                </div>
              ) : (
                <div className="space-y-2">
                  {blockedSlots.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 bg-red-50/60 rounded-xl border border-red-200 flex items-center justify-between shadow-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-red-950">
                            {b.court_number === 0 ? 'All 11 Courts' : `Court ${b.court_number}`}
                          </span>
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-extrabold rounded">
                            {b.reason || 'Maintenance'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {b.start_hour > 12 ? `${b.start_hour - 12}:00 PM` : `${b.start_hour}:00 AM`} to{' '}
                          {b.end_hour === 24
                            ? '12:00 AM'
                            : b.end_hour > 12
                            ? `${b.end_hour - 12}:00 PM`
                            : `${b.end_hour}:00 AM`}{' '}
                          • {b.block_date === 'ALL' || b.block_date === '2099-12-31' ? 'All Dates' : b.block_date}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnblock(b.id)}
                        className="px-2.5 py-1 bg-white hover:bg-red-100 text-red-600 border border-red-200 rounded font-bold text-xs transition-colors shadow-xs"
                      >
                        Remove Block
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: WALKIN */}
      {activeModal === 'walkin' && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-900 text-white rounded-xl">
                  <span className="material-symbols-outlined text-[22px]">person_add</span>
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-slate-900">
                    Record Walk-in Booking
                  </h3>
                  <p className="text-xs text-slate-500">Offline player booking directly at the arena</p>
                </div>
              </div>
              <button onClick={() => setActiveModal('none')} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
                ✕
              </button>
            </div>

            <form onSubmit={handleWalkinSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Player Full Name</label>
                <input
                  type="text"
                  required
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={walkinPhone}
                  onChange={(e) => setWalkinPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Court</label>
                  <select
                    value={walkinCourt}
                    onChange={(e) => setWalkinCourt(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => (
                      <option key={n} value={n}>
                        Court {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time Slot</label>
                  <select
                    value={walkinSlot}
                    onChange={(e) => setWalkinSlot(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    {TIME_ROWS.map((t) => (
                      <option key={t.display} value={t.display}>
                        {t.display}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-blue-600 text-white font-heading font-bold text-xs rounded-lg transition-all shadow-md mt-2"
              >
                Confirm Walk-in Reservation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
