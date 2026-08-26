'use client';

import { useState, useEffect } from 'react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('about');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      const sections = ['about', 'courts', 'book-court', 'location'];
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      id="navbar"
      className={`fixed w-full top-0 z-50 bg-surface border-b border-outline-variant/30 transition-all duration-300 ${
        isScrolled ? 'shadow-md py-1 bg-surface/95 backdrop-blur-md' : 'py-0'
      }`}
    >
      <div className="flex justify-between items-center h-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <a href="#about" className="flex items-center gap-3">
          <img
            alt="Gurukul's Sports Logo"
            className="h-10 w-10 object-contain rounded-md"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCiYoVGed0fXMy8vFkpDCD10eJ44I_VPDLGFRRpTDW9WTUpDRRa8rmtKd4MF5P-fQaUus055ieKlMlDDEuis4-qsAHRU7cSi2nvJ_7kM7znp5nvGJPG0HqDRq1dh40UnJdFmIe4kvcSQjNK4dhdNug0ziEAh9zk9bPbHLlhqIwo6oF4HJ929plC1LI3Edwb0Z-3c9VoENfPOFU9jomxLut-nSIBGA4qdmFS8mdjViTTuFN5zrofULc"
          />
          <span className="text-title-md font-title-md font-bold text-on-surface tracking-tight">
            Gurukul's Sports ®
          </span>
        </a>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#about"
            className={`nav-link font-medium transition-colors duration-200 pb-1 border-b-2 ${
              activeSection === 'about'
                ? 'text-secondary font-bold border-secondary'
                : 'text-on-surface-variant hover:text-secondary border-transparent'
            }`}
          >
            About
          </a>
          <a
            href="#courts"
            className={`nav-link font-medium transition-colors duration-200 pb-1 border-b-2 ${
              activeSection === 'courts'
                ? 'text-secondary font-bold border-secondary'
                : 'text-on-surface-variant hover:text-secondary border-transparent'
            }`}
          >
            Courts
          </a>
          <a
            href="#book-court"
            className={`nav-link font-medium transition-colors duration-200 pb-1 border-b-2 ${
              activeSection === 'book-court'
                ? 'text-secondary font-bold border-secondary'
                : 'text-on-surface-variant hover:text-secondary border-transparent'
            }`}
          >
            Book Court
          </a>
          <a
            href="#location"
            className={`nav-link font-medium transition-colors duration-200 pb-1 border-b-2 ${
              activeSection === 'location'
                ? 'text-secondary font-bold border-secondary'
                : 'text-on-surface-variant hover:text-secondary border-transparent'
            }`}
          >
            Location & Contact
          </a>

          <a
            href="#book-court"
            className="ml-2 inline-flex items-center justify-center px-5 py-2.5 text-white font-label-md text-label-md rounded-full bg-[#0F172A] hover:bg-[#2563EB] transition-colors shadow-sm"
          >
            Book Slot
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-on-surface p-2 rounded-lg hover:bg-surface-container-high focus:outline-none"
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined text-[28px]">
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface-container-lowest border-b border-outline-variant px-6 py-4 space-y-3 animate-in slide-in-from-top-2">
          <a
            href="#about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-on-surface font-medium hover:text-secondary"
          >
            About
          </a>
          <a
            href="#courts"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-on-surface font-medium hover:text-secondary"
          >
            Courts & Facilities
          </a>
          <a
            href="#book-court"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-secondary font-bold"
          >
            Book Court Online
          </a>
          <a
            href="#location"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-on-surface font-medium hover:text-secondary"
          >
            Location & Hours
          </a>
        </div>
      )}
    </nav>
  );
}
