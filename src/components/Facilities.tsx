export default function Facilities() {
  return (
    <section className="py-stack-lg px-margin-mobile md:px-margin-desktop bg-surface max-w-container-max mx-auto" id="courts">
      <div className="text-center mb-12">
        <h2 className="font-headline-lg text-headline-lg text-[#0F172A] mb-4">World-Class Facilities</h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">
          Designed for performance, safety, and comfort. Our complex features dedicated zones for multiple disciplines.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {/* Facility Card 1 */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 overflow-hidden hover:shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-all duration-300 flex flex-col group h-full">
          <div className="h-48 bg-surface-container-high relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0F172A]/10 to-transparent"></div>
            <span className="material-symbols-outlined absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[64px] text-[#2563EB]/20 group-hover:scale-110 transition-transform duration-500">
              sports_tennis
            </span>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-title-md text-title-md text-[#0F172A]">Badminton Courts</h3>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6 flex-1">
              Premium playing surfaces featuring both synthetic mats and shock-absorbing wooden flooring. Equipped with anti-glare LED lighting.
            </p>
            <a
              className="font-label-md text-label-md text-[#2563EB] flex items-center gap-1 hover:gap-2 transition-all mt-auto"
              href="#book-court"
            >
              Book now <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </a>
          </div>
        </div>

        {/* Facility Card 2 */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 overflow-hidden hover:shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-all duration-300 flex flex-col group h-full">
          <div className="h-48 bg-surface-container-high relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0F172A]/10 to-transparent"></div>
            <span className="material-symbols-outlined absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[64px] text-[#2563EB]/20 group-hover:scale-110 transition-transform duration-500">
              pool
            </span>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-title-md text-title-md text-[#0F172A]">Swimming Pool</h3>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6 flex-1">
              Temperature-controlled aquatic center with professional lane division, suitable for training and recreational swimming year-round.
            </p>
            <div className="mt-auto flex items-center justify-between"></div>
          </div>
        </div>

        {/* Facility Card 3 */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 overflow-hidden hover:shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-all duration-300 flex flex-col group h-full">
          <div className="h-48 bg-surface-container-high relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0F172A]/10 to-transparent"></div>
            <span className="material-symbols-outlined absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[64px] text-[#2563EB]/20 group-hover:scale-110 transition-transform duration-500">
              sports_tennis
            </span>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-title-md text-title-md text-[#0F172A]">Table Tennis</h3>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6 flex-1">
              Dedicated high-ceiling zone featuring premium ITTF approved tables with specialized grip flooring for optimal movement.
            </p>
            <div className="mt-auto flex items-center justify-between"></div>
          </div>
        </div>

        {/* Facility Card 4 */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 overflow-hidden hover:shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-all duration-300 flex flex-col group h-full">
          <div className="h-48 bg-surface-container-high relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0F172A]/10 to-transparent"></div>
            <span className="material-symbols-outlined absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[64px] text-[#2563EB]/20 group-hover:scale-110 transition-transform duration-500">
              sports_martial_arts
            </span>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-title-md text-title-md text-[#0F172A]">Martial Arts</h3>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6 flex-1">
              Dedicated Martial Arts training arena equipped with safety tatami mats, punching bags, and gear. Professional coaching and self-defense batches available.
            </p>
            <div className="mt-auto flex items-center justify-between"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
