import Image from "next/image";
import Link from "next/link";
import { CATEGORIES, HERO_IMAGE, type Destination } from "./home-content";

/** Category tiles, the featured car and the AI Car Finder teaser. */
export default function HomeCollection({ destination }: { destination: Destination }) {
  return (
    <>
      <section className="mx-auto max-w-[1300px] px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ad8845]">
              Explore our collection
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              A car for every kind of journey.
            </h2>
          </div>

          <Link
            href={destination("/cars")}
            className="text-sm font-semibold text-[#12201b] underline decoration-[#b8893f] decoration-2 underline-offset-4 transition hover:text-[#806329]"
          >
            View all cars →
          </Link>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((category, index) => (
            <Link
              key={category.type}
              href={destination(`/cars?type=${category.type}`)}
              className="group relative flex min-h-[190px] flex-col justify-between overflow-hidden rounded-2xl border border-[#e3dccf] bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-[#c6a15b]/70 hover:bg-[#12201b] hover:text-white hover:shadow-xl hover:shadow-[#12201b]/10"
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold tracking-[0.18em] text-[#ad8845]">
                  0{index + 1}
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e3dccf] text-lg transition group-hover:border-[#d4af6a]/40 group-hover:text-[#d4af6a]">
                  ↗
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-semibold">{category.label}</h3>
                <p className="mt-2 text-sm text-[#12201b]/60 transition group-hover:text-white/65">
                  {category.note}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1300px] gap-5 px-5 pb-20 sm:px-8 lg:grid-cols-[1.4fr_1fr] lg:px-12 lg:pb-24">
        <article className="relative min-h-[440px] overflow-hidden rounded-3xl bg-[#0a1411] text-white">
          <Image
            src={HERO_IMAGE}
            alt="BMW M4"
            fill
            unoptimized
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1411] via-[#0a1411]/40 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end justify-between gap-5 p-7 sm:p-9">
            <div>
              <p className="text-sm font-semibold text-[#d4af6a]">Featured vehicle</p>
              <h3 className="mt-2 text-4xl font-semibold tracking-tight">BMW M4</h3>
              <ul className="mt-4 flex flex-wrap gap-2 text-xs">
                {["Luxury", "Automatic", "4 seats"].map((item) => (
                  <li key={item} className="rounded-full border border-white/25 px-3 py-1.5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-3xl font-semibold">4,500</p>
              <p className="mt-1 text-xs text-white/65">EGP per day</p>
              <Link
                href={destination("/cars")}
                className="mt-4 inline-block rounded-full bg-[#d4af6a] px-6 py-3 text-sm font-semibold text-[#0a1411] hover:bg-[#e6c585]"
              >
                Explore cars →
              </Link>
            </div>
          </div>
        </article>

        <aside className="flex flex-col justify-between rounded-3xl bg-[#1a3a2e] p-7 text-[#f3efe6] sm:p-9">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af6a]">AI Car Finder</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Not sure which car fits?
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/70">
              Tell us your budget, how many people are travelling, and the style you prefer.
              Discover cars that match your needs.
            </p>
          </div>

          <div className="mt-10">
            <ul className="mb-7 space-y-4 text-sm text-white/85">
              {[
                "Set your daily budget",
                "Choose passenger capacity",
                "Get recommendations based on your needs",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4af6a]/15 text-xs text-[#d4af6a]">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href={destination("/recommendations")}
              className="inline-flex items-center gap-3 rounded-full bg-[#f3efe6] px-6 py-3 text-sm font-semibold text-[#12201b] transition hover:bg-white"
            >
              Find my car
              <span>→</span>
            </Link>
          </div>
        </aside>
      </section>
    </>
  );
}
