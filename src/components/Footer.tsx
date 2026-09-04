export default function Footer() {
  return (
    <footer className="bg-inverse-surface border-t border-outline-variant/10 text-white" id="location">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter py-stack-lg px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        {/* Brand & Info */}
        <div className="flex flex-col gap-4">
          <a className="flex items-center gap-3 mb-2" href="#about">
            <img
              alt="Gurukul's Sports Logo"
              className="h-9 w-9 object-contain rounded-md bg-white p-0.5"
              src="/logo.jpeg"
            />
            <span className="text-title-md font-title-md font-bold text-surface-container-lowest tracking-tight">
              Gurukul&apos;s Sports<sup className="text-xs ml-0.5">®</sup>
            </span>
          </a>
          <p className="font-body-md text-sm text-surface-dim max-w-sm leading-relaxed">
            Premier Athletics &amp; Hospitality. Providing world-class badminton courts and sporting infrastructure to Bengaluru's active community.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <a
              className="w-9 h-9 rounded-full bg-surface-container-lowest/10 flex items-center justify-center text-surface-container-lowest hover:bg-[#2563EB] transition-colors"
              href="https://maps.app.goo.gl/5wQLkvAL4tY11cTH9"
              target="_blank"
              rel="noopener noreferrer"
              title="Open Google Maps Location"
            >
              <span className="material-symbols-outlined text-[18px]">location_on</span>
            </a>
          </div>
        </div>

        {/* Location & Hours */}
        <div className="flex flex-col gap-4">
          <h4 className="font-title-md text-base font-bold text-surface-container-lowest mb-1">
            Location &amp; Contact
          </h4>
          <a
            href="https://maps.app.goo.gl/5wQLkvAL4tY11cTH9"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 group hover:opacity-90 transition-opacity"
            title="Open in Google Maps"
          >
            <span className="material-symbols-outlined text-surface-dim group-hover:text-[#38BDF8] mt-0.5 text-[20px] transition-colors">
              location_on
            </span>
            <p className="font-body-md text-sm text-surface-dim group-hover:text-white leading-relaxed transition-colors">
              Varthur Main Road,<br />
              near Kapoor's Cafe,<br />
              Whitefield, Bengaluru, Karnataka 560066
            </p>
          </a>
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
              call
            </span>
            <div className="flex flex-col gap-0.5 text-sm font-body-md text-surface-dim">
              <a
                className="hover:text-[#38BDF8] transition-colors font-medium"
                href="tel:+919482156333"
              >
                +91 9482156333
              </a>
              <a
                className="hover:text-[#38BDF8] transition-colors font-medium"
                href="tel:+917676397018"
              >
                +91 7676397018
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3 group mt-1">
            <span className="material-symbols-outlined text-surface-dim mt-0.5 text-[20px]">
              mail
            </span>
            <a
              className="font-body-md text-sm text-surface-dim hover:text-[#38BDF8] transition-colors"
              href="mailto:gurukulssportsblr@gmail.com"
            >
              gurukulssportsblr@gmail.com
            </a>
          </div>
        </div>

        {/* Map Location Card */}
        <div className="flex flex-col gap-4">
          <h4 className="font-title-md text-base font-bold text-surface-container-lowest mb-1">
            Find Us
          </h4>
          <a
            href="https://maps.app.goo.gl/5wQLkvAL4tY11cTH9"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-32 rounded-xl border border-surface-container-lowest/20 overflow-hidden relative group cursor-pointer"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{
                backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuD7JH783SsmbgaoJQ-vmzQTAb6F3AOEpb8G07dllIi7AVo4TT2L_1BvVLLolekPOTlJ6W_0fvpm-6I_33csdps570aYGxFlzyQw4UjroZ7SJnDMoujVjKItCOHvdXLFdC-fXWLfNW-P9oHcaIrlvXk-hR0BQMLsL7BEFDeyHb2YsUPFZaWaO5sKZkhnb-Flf_fBBlSdQaauKJY0kGvpkxptcGw1FjEaEH-bhVAP-PzXuMogsOutq0Q")`,
              }}
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-surface-container-lowest/20 backdrop-blur-sm rounded text-[10px] text-surface-container-lowest font-label-sm z-10">
              Bengaluru
            </div>
          </a>

          <div className="flex items-center gap-3 mt-2">
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
            <span className="text-surface-dim/40">•</span>
            <a
              className="font-label-sm text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 font-semibold"
              href="/admin.html"
              title="Host Operations & Admin Portal"
            >
              <span className="material-symbols-outlined text-[14px]">lock</span>
              Host Portal
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-surface-container-lowest/10 py-6 px-margin-mobile md:px-margin-desktop text-center">
        <p className="font-label-sm text-xs text-surface-dim/70">
          © {new Date().getFullYear()} Gurukul&apos;s Sports<sup className="text-[10px] ml-0.5">®</sup>. Premier Athletics &amp; Hospitality. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
