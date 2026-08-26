export default function Footer() {
  return (
    <footer className="bg-inverse-surface border-t border-outline-variant/10 text-white" id="location">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter py-stack-lg px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        {/* Brand & Info */}
        <div className="flex flex-col gap-4">
          <a className="flex items-center gap-3 mb-2" href="#about">
            <img
              alt="Gurukul's Sports Logo"
              className="h-9 w-9 object-contain rounded-md grayscale brightness-200"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCiYoVGed0fXMy8vFkpDCD10eJ44I_VPDLGFRRpTDW9WTUpDRRa8rmtKd4MF5P-fQaUus055ieKlMlDDEuis4-qsAHRU7cSi2nvJ_7kM7znp5nvGJPG0HqDRq1dh40UnJdFmIe4kvcSQjNK4dhdNug0ziEAh9zk9bPbHLlhqIwo6oF4HJ929plC1LI3Edwb0Z-3c9VoENfPOFU9jomxLut-nSIBGA4qdmFS8mdjViTTuFN5zrofULc"
            />
            <span className="text-title-md font-title-md font-bold text-surface-container-lowest tracking-tight">
              Gurukul's Sports ®
            </span>
          </a>
          <p className="font-body-md text-sm text-surface-dim max-w-sm leading-relaxed">
            Premier Athletics &amp; Hospitality. Providing world-class badminton courts and sporting infrastructure to Bengaluru's active community.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <a
              className="w-9 h-9 rounded-full bg-surface-container-lowest/10 flex items-center justify-center text-surface-container-lowest hover:bg-[#2563EB] transition-colors"
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
              title="Google Maps"
            >
              <span className="material-symbols-outlined text-[18px]">location_on</span>
            </a>
            <a
              className="w-9 h-9 rounded-full bg-surface-container-lowest/10 flex items-center justify-center text-surface-container-lowest hover:bg-[#10B981] transition-colors"
              href="tel:+919876543210"
              title="Call Us"
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
            </a>
          </div>
        </div>

        {/* Location & Hours */}
        <div className="flex flex-col gap-4">
          <h4 className="font-title-md text-base font-bold text-surface-container-lowest mb-1">
            Location &amp; Hours
          </h4>
          <div className="flex items-start gap-3 group">
            <span className="material-symbols-outlined text-surface-dim mt-0.5 text-[20px]">
              location_on
            </span>
            <p className="font-body-md text-sm text-surface-dim leading-relaxed">
              Varthur Main Road,<br />
              near Kapoor's Cafe,<br />
              Whitefield, Bengaluru, Karnataka 560066
            </p>
          </div>
          <div className="flex items-start gap-3 group mt-1">
            <span className="material-symbols-outlined text-surface-dim mt-0.5 text-[20px]">
              schedule
            </span>
            <p className="font-body-md text-sm text-surface-dim">
              6:00 AM – 12:00 AM<br />
              (Monday – Sunday Daily)
            </p>
          </div>
          <div className="flex items-start gap-3 group mt-1">
            <span className="material-symbols-outlined text-surface-dim mt-0.5 text-[20px]">
              mail
            </span>
            <a
              className="font-body-md text-sm text-surface-dim hover:text-[#38BDF8] transition-colors"
              href="mailto:contact@gurukulsports.com"
            >
              contact@gurukulsports.com
            </a>
          </div>
        </div>

        {/* Map Location Card */}
        <div className="flex flex-col gap-4">
          <h4 className="font-title-md text-base font-bold text-surface-container-lowest mb-1">
            Find Us on Map
          </h4>
          <a
            href="https://maps.google.com/?q=Gurukul+Sports+Whitefield+Bengaluru"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-32 bg-surface-container-lowest/10 rounded-xl border border-surface-container-lowest/20 overflow-hidden relative group cursor-pointer flex items-center justify-center hover:border-[#2563EB] transition-all"
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                backgroundSize: '10px 10px',
              }}
            />
            <div className="z-10 flex flex-col items-center gap-1 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[32px] text-[#38BDF8]">
                location_on
              </span>
              <span className="text-xs text-white font-semibold">Open in Google Maps</span>
            </div>
            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-surface-container-lowest/20 backdrop-blur-sm rounded text-[10px] text-surface-container-lowest font-label-sm">
              Whitefield, BLR
            </div>
          </a>

          <div className="flex gap-4 mt-2">
            <a
              className="font-label-sm text-xs text-surface-dim hover:text-white transition-colors"
              href="#"
            >
              Privacy Policy
            </a>
            <span className="text-surface-dim/40">•</span>
            <a
              className="font-label-sm text-xs text-surface-dim hover:text-white transition-colors"
              href="#"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-surface-container-lowest/10 py-6 px-margin-mobile md:px-margin-desktop text-center">
        <p className="font-label-sm text-xs text-surface-dim/70">
          © {new Date().getFullYear()} Gurukul's Sports ®. Premier Athletics &amp; Hospitality. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
