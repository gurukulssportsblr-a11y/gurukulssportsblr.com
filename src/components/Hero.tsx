export default function Hero() {
  return (
    <section className="relative w-full min-h-[90vh] flex items-center pt-stack-lg pb-stack-lg" id="about">
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url("https://lh3.googleusercontent.com/aida/AEtjO1VDlE_DcLNH1UGi6GQVMlElmU3uNAaYielWzS_VdmCbdUQSU3fIzWG_MBF-EXkW2VILp7dJWAdbQrYn2xOOfoVz5zaYWpF9nMfbGzxqzFr4s7_OSSgoNY7BiuxtSsWeV7Z7ONqHETgCuZUBUG1N3pSopk3KYzzFUaUKp0FskF6zJD-t-0HRL2_08p3C4Os5YLDchvBByt7Mi0ebUrlYf50YTsGed4mtfsjzpnbdzMxQoS5ayQnRJJ00")`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface/95 via-surface/80 to-surface/30"></div>
      </div>

      <div className="relative z-10 w-full px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2563EB]/10 text-[#2563EB] font-label-sm text-label-sm font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            Open Now • 6:00 AM – 12:00 AM Daily
          </div>

          <h1 className="font-display-lg text-display-lg text-[#0F172A] mb-6 leading-tight">
            Bengaluru's Premier<br />Badminton &amp; Sports Hub
          </h1>

          <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-xl">
            10 international-standard courts on Varthur Main Road, Whitefield. Experience professional-grade facilities designed for champions and enthusiasts alike.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <a
              className="inline-flex items-center justify-center px-8 py-4 text-white font-label-md text-label-md rounded-full transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] bg-[#0F172A] hover:bg-[#2563EB] hover:scale-105 active:scale-95"
              href="#book-court"
            >
              Reserve a Slot Now
            </a>
            <a
              className="inline-flex items-center justify-center px-8 py-4 text-[#0F172A] font-label-md text-label-md rounded-full transition-colors border border-outline-variant hover:bg-surface-container-high"
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
                <h3 className="font-label-md text-label-md text-[#0F172A]">Pro Courts</h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">BWF-Grade Synthetic & Wooden</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-surface-container-lowest rounded-lg border border-outline-variant/50 text-[#2563EB] shadow-sm">
                <span className="material-symbols-outlined text-[24px]">schedule</span>
              </div>
              <div>
                <h3 className="font-label-md text-label-md text-[#0F172A]">Flexible Hours</h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Open 6:00 AM – 12:00 AM Daily</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-surface-container-lowest rounded-lg border border-outline-variant/50 text-[#2563EB] shadow-sm">
                <span className="material-symbols-outlined text-[24px]">sports</span>
              </div>
              <div>
                <h3 className="font-label-md text-label-md text-[#0F172A]">Expert Training</h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Pro Coaching Available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
