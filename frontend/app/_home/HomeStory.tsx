import Link from "next/link";
import { PERKS, STEPS, type Destination } from "./home-content";

/** How it works, why DriveX, and the closing call to action. */
export default function HomeStory({ destination }: { destination: Destination }) {
  return (
    <>
      <section id="how-it-works" className="bg-[#12201b] py-20 text-[#f3efe6] lg:py-24">
        <div className="mx-auto max-w-[1300px] px-5 sm:px-8 lg:px-12">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d4af6a]">The process</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            From choosing to driving in three steps.
          </h2>

          <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative border-t border-white/20 pt-7">
                <span className="absolute -top-3 left-0 bg-[#12201b] pr-3 text-sm font-semibold text-[#d4af6a]">
                  STEP 0{index + 1}
                </span>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-7 text-white/65">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-[1300px] px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ad8845]">
          The DriveX difference
        </p>
        <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Renting should feel easy.
        </h2>

        <dl className="mt-10 grid gap-x-12 gap-y-9 sm:grid-cols-2">
          {PERKS.map((perk, index) => (
            <div key={perk.title} className="flex gap-4 border-t border-[#12201b]/10 pt-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8dfca] text-sm font-bold text-[#806329]">
                0{index + 1}
              </span>
              <div>
                <dt className="text-lg font-semibold">{perk.title}</dt>
                <dd className="mt-2 max-w-md text-sm leading-7 text-[#12201b]/65">{perk.text}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <section className="px-5 pb-20 sm:px-8 lg:px-12">
        <div className="relative mx-auto flex max-w-[1300px] flex-col items-start justify-between gap-8 overflow-hidden rounded-3xl bg-[#0a1411] p-8 text-[#f3efe6] sm:p-12 lg:flex-row lg:items-center">
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#d4af6a]/10 blur-3xl" />

          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d4af6a]">
              Your next journey
            </p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Your next trip starts with one booking.
            </h2>
          </div>

          <div className="relative flex flex-wrap gap-3">
            <Link
              href={destination("/cars")}
              className="rounded-full bg-[#d4af6a] px-7 py-3.5 text-sm font-semibold text-[#0a1411] transition hover:bg-[#e6c585]"
            >
              Browse cars
            </Link>
            <Link
              href={destination("/recommendations")}
              className="rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold transition hover:border-[#d4af6a] hover:bg-white/5"
            >
              Help me choose
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
