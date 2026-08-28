'use client';

import { useState, useEffect } from 'react';

interface PromoData {
  enabled: boolean;
  badge: string;
  headline: string;
  message: string;
  ctaText: string;
}

export default function PromoBanner() {
  const [promo, setPromo] = useState<PromoData | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [bannerClosed, setBannerClosed] = useState(false);

  useEffect(() => {
    async function fetchPromo() {
      try {
        const res = await fetch('/api/promo-banner');
        if (res.ok) {
          const data = await res.json();
          if (data.banner && data.banner.enabled) {
            setPromo(data.banner);
            // Show popup after 1.5s if not previously dismissed in session
            if (!sessionStorage.getItem('gs_promo_dismissed')) {
              setTimeout(() => setShowPopup(true), 1500);
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch promo banner:', err);
      }
    }
    fetchPromo();
  }, []);

  const dismissPopup = () => {
    setShowPopup(false);
    sessionStorage.setItem('gs_promo_dismissed', 'true');
  };

  if (!promo || !promo.enabled) return null;

  return (
    <>
      {/* 1. Top Announcement Bar */}
      {!bannerClosed && (
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-950 text-white px-4 py-2.5 shadow-md relative z-50 transition-all">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[10px] sm:text-xs uppercase tracking-wider whitespace-nowrap shadow-sm">
                {promo.badge || 'SPECIAL OFFER'}
              </span>
              <p className="font-medium text-white truncate">
                {promo.headline}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <a
                href="#book-court"
                className="px-3 py-1 bg-white text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-300 transition-colors shadow-sm whitespace-nowrap"
              >
                {promo.ctaText || 'Book Now →'}
              </a>
              <button
                onClick={() => setBannerClosed(true)}
                title="Dismiss Banner"
                className="text-white/70 hover:text-white transition-colors p-0.5"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Welcome Promo Modal / Pop-up Notification */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center relative overflow-hidden transform animate-scale-up">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-blue-600 to-emerald-500"></div>

            <button
              onClick={dismissPopup}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              ✕
            </button>

            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <span className="material-symbols-outlined text-amber-600 text-[36px]">campaign</span>
            </div>

            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 font-extrabold text-xs rounded-full uppercase tracking-wider mb-2">
              {promo.badge}
            </span>

            <h3 className="font-heading font-extrabold text-xl text-slate-900 leading-snug mb-3">
              {promo.headline}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
              {promo.message}
            </p>

            <div className="flex flex-col gap-2.5">
              <a
                href="#book-court"
                onClick={dismissPopup}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                <span>{promo.ctaText || 'Book Discounted Court'}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </a>
              <button
                onClick={dismissPopup}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium py-1 transition-colors"
              >
                No thanks, continue browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
