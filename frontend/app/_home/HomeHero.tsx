import Image from "next/image";
import Link from "next/link";
import { HERO_IMAGE, type Destination } from "./home-content";

const STATS = [
  ["100+", "Cars available"],
  ["5+", "Pickup branches"],
  ["24/7", "Support"],
];

export default function HomeHero({ destination }: { destination: Destination }) {
  return (
    <section className="relative overflow-hidden bg-[#0a1411] text-[#f3efe6]">
      <Image
        src={HERO_IMAGE}
        alt="BMW M4 available for rent"
        fill
        unoptimized
        preload
        sizes="100vw"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
        className="absolute inset-0 h-full w-full object-cover object-[65%_center]"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-[#0a1411] via-[#0a1411]/90 to-[#0a1411]/25" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0a1411] to-transparent" />
      <div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-[#d4af6a]/10 blur-3xl" />

      <div className="relative z-10 mx-auto min-h-[700px] max-w-[1300px] px-5 pb-40 pt-32 sm:px-8 lg:min-h-[800px] lg:px-12 lg:pb-48 lg:pt-40">
        <div className="max-w-3xl">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-[#d4af6a]/30 bg-black/20 px-4 py-2 text-sm font-medium text-[#e7cb91] backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-[#d4af6a]" />
            Your journey, your choice
          </div>

          <h1 className="text-5xl font-semibold leading-[1.03] tracking-[-0.04em] sm:text-6xl lg:text-[78px]">
            The right car,
            <span className="mt-2 block text-[#d4af6a]">ready when you are.</span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-8 text-[#f3efe6]/70 sm:text-lg">
            Discover the right vehicle for your next trip with flexible rentals, clear daily
            prices, and a straightforward booking experience.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href={destination("/cars")}
              className="group inline-flex items-center gap-3 rounded-full bg-[#d4af6a] px-7 py-3.5 text-sm font-semibold text-[#0a1411] transition duration-300 hover:-translate-y-0.5 hover:bg-[#e6c585]"
            >
              Browse cars
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>

            <Link
              href={destination("/recommendations")}
              className="inline-flex items-center gap-3 rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition duration-300 hover:border-[#d4af6a] hover:bg-white/10"
            >
              Help me choose
              <span className="text-[#d4af6a]">→</span>
            </Link>
          </div>

          <div className="mt-14 flex flex-wrap gap-x-10 gap-y-5 border-t border-white/15 pt-7">
            {STATS.map(([value, label]) => (
              <div key={label}>
                <p className="text-2xl font-semibold text-[#d4af6a] sm:text-3xl">{value}</p>
                <p className="mt-1 text-sm text-white/60">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
