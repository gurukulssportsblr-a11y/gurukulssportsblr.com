export default function Facilities() {
  return (
    <section className="py-stack-lg px-margin-mobile md:px-margin-desktop bg-surface max-w-container-max mx-auto" id="courts">
      <div className="text-center mb-12">
        <h2 className="font-headline-lg text-headline-lg text-[#0F172A] mb-4">World-Class Facilities</h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">
          Designed for performance, safety, and comfort. Our complex features dedicated zones for multiple disciplines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {/* Facility Card 1 - Badminton */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 overflow-hidden hover:shadow-[0_8px_30px_rgba(15,23,42,0.08)] transition-all duration-300 flex flex-col group hover:-translate-y-1">
          <div className="h-48 bg-[#0F172A] relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0F172A] via-[#1E293B] to-[#2563EB]/40 opacity-90"></div>
            <span className="material-symbols-outlined absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[72px] text-white/40 group-hover:scale-110 group-hover:text-[#2563EB]/80 transition-all duration-500">
              sports_tennis
            </span>
            <span className="absolute bottom-3 left-4 px-2.5 py-1 bg-white/10 backdrop-blur-md text-white text-xs font-semibold rounded-md border border-white/20">
              Primary Arena
            </span>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-title-md text-title-md text-[#0F172A] font-bold">Badminton Courts</h3>
              <span className="px-2.5 py-1 bg-[#2563EB]/10 text-[#2563EB] text-[11px] font-bold rounded-full uppercase tracking-wider">
                10 Courts
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mb-4 flex-1">
              Premium playing surfaces featuring both synthetic mats and shock-absorbing wooden flooring. Equipped with anti-glare LED lighting.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-[#10B981]">check_circle</span>
                BWF Approved Surfaces (Synthetic & Wooden)
              </li>
              <li className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-[#10B981]">check_circle</span>
                1000 Lux Anti-glare Arena Lighting
              </li>
              <li className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-[#10B981]">check_circle</span>
                Spacious player lounge & shower facilities
              </li>
            </ul>
            <a
              className="font-label-md text-label-md text-[#2563EB] font-bold flex items-center gap-1 hover:gap-2 transition-all mt-auto"
              href="#book-court"
            >
              Book Court Now <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </a>
          </div>
        </div>

        {/* Facility Card 2 - Swimming */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 overflow-hidden hover:shadow-[0_8px_30px_rgba(15,23,42,0.08)] transition-all duration-300 flex flex-col group hover:-translate-y-1">
          <div className="h-48 bg-[#0F172A] relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0F172A] via-[#0284C7]/40 to-[#38BDF8]/30 opacity-90"></div>
            <span className="material-symbols-outlined absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[72px] text-white/40 group-hover:scale-110 group-hover:text-[#38BDF8]/80 transition-all duration-500">
              pool
            </span>
            <span className="absolute bottom-3 left-4 px-2.5 py-1 bg-white/10 backdrop-blur-md text-white text-xs font-semibold rounded-md border border-white/20">
              Aquatics
            </span>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-title-md text-title-md text-[#0F172A] font-bold">Swimming Pool</h3>
              <span className="px-2.5 py-1 bg-surface-container-high text-on-surface-variant text-[11px] font-bold rounded-full uppercase tracking-wider">
                Olympic Std
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mb-4 flex-1">
              Temperature-controlled aquatic center with professional lane division, suitable for training and recreational swimming year-round.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-[#10B981]">check_circle</span>
                Temperature Controlled Water
              </li>
              <li className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-[#10B981]">check_circle</span>
                Multi-stage UV Filtration System
              </li>
              <li className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-[#10B981]">check_circle</span>
                Dedicated coaching lanes & lifeguards
              </li>
            </ul>
            <a
              className="font-label-md text-label-md text-[#0F172A] font-semibold flex items-center gap-1 hover:gap-2 transition-all mt-auto"
              href="#location"
            >
              Enquire at Reception <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </a>
          </div>
        </div>

        {/* Facility Card 3 - Table Tennis */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 overflow-hidden hover:shadow-[0_8px_30px_rgba(15,23,42,0.08)] transition-all duration-300 flex flex-col group hover:-translate-y-1">
          <div className="h-48 bg-[#0F172A] relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0F172A] via-[#334155] to-[#E11D48]/30 opacity-90"></div>
            <span className="material-symbols-outlined absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[72px] text-white/40 group-hover:scale-110 group-hover:text-[#F43F5E]/80 transition-all duration-500">
              sports_tennis
            </span>
            <span className="absolute bottom-3 left-4 px-2.5 py-1 bg-white/10 backdrop-blur-md text-white text-xs font-semibold rounded-md border border-white/20">
              Indoor Arena
            </span>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-title-md text-title-md text-[#0F172A] font-bold">Table Tennis</h3>
              <span className="px-2.5 py-1 bg-surface-container-high text-on-surface-variant text-[11px] font-bold rounded-full uppercase tracking-wider">
                Premium
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mb-4 flex-1">
              Dedicated high-ceiling zone featuring premium ITTF approved tables with specialized grip flooring for optimal movement.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-[#10B981]">check_circle</span>
                ITTF Approved Stag Professional Tables
              </li>
              <li className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-[#10B981]">check_circle</span>
                Anti-slip Shock Absorbing Floor
              </li>
              <li className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-[#10B981]">check_circle</span>
                Robot practice & Multi-ball coaching
              </li>
            </ul>
            <a
              className="font-label-md text-label-md text-[#0F172A] font-semibold flex items-center gap-1 hover:gap-2 transition-all mt-auto"
              href="#location"
            >
              Enquire at Reception <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
