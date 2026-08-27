'use client';

import { useState, useEffect, useCallback } from 'react';

export const COURT_CAROUSEL_IMAGES = [
  {
    src: '/images/courts/court-1.jpg',
    alt: 'Gurukul Sports BWF Standard Badminton Court Arena 1',
    title: 'Court 1 – International Standard Mat',
  },
  {
    src: '/images/courts/court-2.jpg',
    alt: 'Gurukul Sports Badminton Courts View 2',
    title: 'Court 2 – 1000 Lux Anti-Glare Lighting',
  },
  {
    src: '/images/courts/court-3.jpg',
    alt: 'Gurukul Sports Pro Training Courts 3',
    title: 'Court 3 – Shock Absorption Playing Surface',
  },
  {
    src: '/images/courts/court-4.jpg',
    alt: 'Gurukul Sports Tournament Arena 4',
    title: 'Court 4 – Match Ready Synthetic Layout',
  },
  {
    src: '/images/courts/court-5.jpg',
    alt: 'Gurukul Sports Complex Wide Arena 5',
    title: 'Court 5 – Premium Athletic Facility',
  },
];

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % COURT_CAROUSEL_IMAGES.length);
    setProgress(0);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) =>
      prev === 0 ? COURT_CAROUSEL_IMAGES.length - 1 : prev - 1
    );
    setProgress(0);
  }, []);

  // 10-Second Auto-Slide Timer + Progress bar
  useEffect(() => {
    const slideInterval = setInterval(() => {
      nextSlide();
    }, 10000); // 10 seconds auto-swipe

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 100); // 100ms * 100 = 10,000ms

    return () => {
      clearInterval(slideInterval);
      clearInterval(progressInterval);
    };
  }, [nextSlide, currentIndex]);

  return (
    <section className="relative w-full min-h-[92vh] flex items-center pt-stack-lg pb-stack-lg overflow-hidden" id="about">
      {/* Background Image Carousel with 10s Transitions */}
      <div className="absolute inset-0 z-0 bg-[#0F172A]">
        {COURT_CAROUSEL_IMAGES.map((image, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={image.src}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out bg-cover bg-center ${
                isActive
                  ? 'opacity-100 scale-105'
                  : 'opacity-0 scale-100 pointer-events-none'
              }`}
              style={{
                backgroundImage: `url("${image.src}")`,
              }}
              role="img"
              aria-label={image.alt}
            />
          );
        })}

        {/* Ambient Gradient Overlays for High Legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-surface/95 via-surface/85 to-surface/40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 w-full px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2563EB]/10 text-[#2563EB] font-label-sm text-label-sm font-semibold mb-4 border border-[#2563EB]/20 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            Open Now • 6:00 AM – 12:00 AM Daily
          </div>

          <h1 className="font-display-lg text-display-lg text-[#0F172A] mb-6 leading-tight font-extrabold tracking-tight">
            Bengaluru's Premier<br />Badminton &amp; Sports Hub
          </h1>

          <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-xl font-medium leading-relaxed">
            10 international-standard BWF synthetic courts on Varthur Main Road, Whitefield. Experience professional-grade facilities designed for champions and enthusiasts alike.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <a
              className="inline-flex items-center justify-center px-8 py-4 text-white font-label-md text-label-md rounded-full transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] bg-[#0F172A] hover:bg-[#2563EB] hover:scale-105 active:scale-95"
              href="#book-court"
            >
              Reserve a Slot Now
            </a>
            <a
              className="inline-flex items-center justify-center px-8 py-4 text-[#0F172A] font-label-md text-label-md rounded-full transition-colors border border-outline-variant hover:bg-surface-container-high bg-white/70 backdrop-blur-sm"
              href="#courts"
            >
              View All Facilities
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-outline-variant/30">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-surface-container-lowest rounded-lg border border-outline-variant/50 text-[#2563EB] shadow-sm">
                <span className="material-symbols-outlined text-[24px]">sports_tennis</span>
              </div>
              <div>
                <h3 className="font-label-md text-label-md text-[#0F172A] font-bold">10 Pro Courts</h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">BWF-Grade Synthetic</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-surface-container-lowest rounded-lg border border-outline-variant/50 text-[#2563EB] shadow-sm">
                <span className="material-symbols-outlined text-[24px]">schedule</span>
              </div>
              <div>
                <h3 className="font-label-md text-label-md text-[#0F172A] font-bold">Flexible Hours</h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Open 6:00 AM – 12:00 AM</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-surface-container-lowest rounded-lg border border-outline-variant/50 text-[#2563EB] shadow-sm">
                <span className="material-symbols-outlined text-[24px]">sports</span>
              </div>
              <div>
                <h3 className="font-label-md text-label-md text-[#0F172A] font-bold">Expert Coaching</h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Pro Training Available</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 10-Second Carousel Controls & Live Progress Indicator */}
      <div className="absolute bottom-6 right-6 z-20 hidden sm:flex items-center gap-3 bg-[#0F172A]/85 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/20 text-white shadow-xl">
        <button
          onClick={prevSlide}
          className="p-1 rounded-full hover:bg-white/20 transition-colors text-white/90 hover:text-white"
          aria-label="Previous court photo"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>

        {/* Slide Indicators with 10s countdown bar */}
        <div className="flex items-center gap-1.5">
          {COURT_CAROUSEL_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentIndex(i);
                setProgress(0);
              }}
              className={`h-2 rounded-full transition-all duration-300 relative overflow-hidden ${
                i === currentIndex ? 'w-8 bg-white/30' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            >
              {i === currentIndex && (
                <div
                  className="absolute inset-y-0 left-0 bg-[#38BDF8] transition-all duration-100 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              )}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono font-bold text-white/80 pl-1">
          0{currentIndex + 1} / 0{COURT_CAROUSEL_IMAGES.length}
        </span>

        <button
          onClick={nextSlide}
          className="p-1 rounded-full hover:bg-white/20 transition-colors text-white/90 hover:text-white"
          aria-label="Next court photo"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </section>
  );
}
