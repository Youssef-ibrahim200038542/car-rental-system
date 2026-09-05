"use client";

export default function Home() {
return ( <main className="bg-slate-950">
{/* ================= HERO ================= */} <section className="relative min-h-screen overflow-hidden">
{/* Background Effects */} <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.18),transparent_35%)]" /> <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_80%,rgba(14,165,233,0.10),transparent_30%)]" />


    <div className="absolute -right-40 top-20 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
    <div className="absolute -left-40 bottom-10 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />

    {/* Grid Pattern */}
    <div
      className="absolute inset-0 opacity-[0.025]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    />

    <div className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-16 px-6 pb-16 pt-32 lg:grid-cols-2 lg:gap-10">
      {/* ================= LEFT ================= */}
      <div className="relative z-10 max-w-2xl">
        {/* Badge */}
        <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-sm font-medium text-blue-300 backdrop-blur-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
          Premium car rental experience
        </div>

        {/* Heading */}
        <h1 className="text-5xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
          Your journey.
          <span className="mt-2 block bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Your perfect car.
          </span>
        </h1>

        {/* Description */}
        <p className="mt-7 max-w-xl text-lg leading-8 text-gray-400">
          Discover premium vehicles, flexible rentals, and a seamless
          booking experience designed to get you on the road faster.
        </p>

        {/* Buttons */}
        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="/cars"
            className="group inline-flex items-center gap-3 rounded-full bg-blue-500 px-7 py-3.5 font-semibold text-white shadow-xl shadow-blue-500/20 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-blue-500/30"
          >
            Explore Cars
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </a>

          <a
            href="/recommendations"
            className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-7 py-3.5 font-semibold text-white backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-blue-400/30 hover:bg-blue-500/10"
          >
            Find My Car
            <span className="text-blue-400 transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </a>
        </div>

        {/* Stats */}
        <div className="mt-14 grid max-w-lg grid-cols-3 border-t border-white/10 pt-8">
          <div>
            <p className="text-2xl font-bold text-white">100+</p>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              Cars available
            </p>
          </div>

          <div className="border-l border-white/10 pl-5 sm:pl-8">
            <p className="text-2xl font-bold text-white">5+</p>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              Branches
            </p>
          </div>

          <div className="border-l border-white/10 pl-5 sm:pl-8">
            <p className="text-2xl font-bold text-white">24/7</p>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              Support
            </p>
          </div>
        </div>
      </div>

      {/* ================= RIGHT ================= */}
      <div className="relative hidden lg:block">
        {/* Glow */}
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[100px]" />

        {/* Main Card */}
        <div className="relative">
          {/* Floating Badge */}
          <div className="absolute -left-8 top-10 z-20 rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <svg
                  className="h-5 w-5 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M5 17h14M7 17l1.5-5h7L17 17M9 12l1-3h4l1 3M6 17v2M18 17v2"
                  />
                </svg>
              </div>

              <div>
                <p className="text-xs text-gray-500">Featured</p>
                <p className="text-sm font-semibold text-white">
                  Premium Collection
                </p>
              </div>
            </div>
          </div>

          {/* Image Card */}
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-3 shadow-2xl shadow-black/30 backdrop-blur-sm">
            <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-slate-800 to-slate-950">
              {/* Image Glow */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

              <img
                src="http://127.0.0.1:8000/images/cars/bmw-m4.jpg"
                alt="BMW M4"
                className="aspect-[4/3] w-full object-cover object-center transition duration-700 hover:scale-105"
              />

              {/* Image Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-7">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-300">
                      Featured vehicle
                    </p>

                    <h2 className="mt-1 text-3xl font-bold text-white">
                      BMW M4
                    </h2>

                    <p className="mt-1 text-sm text-gray-400">
                      Luxury • Automatic • 4 Seats
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur-md">
                    <p className="text-xs text-gray-400">From</p>
                    <p className="text-lg font-bold text-white">
                      4,500
                      <span className="ml-1 text-xs font-normal text-gray-400">
                        EGP/day
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Card */}
            <div className="flex items-center justify-between px-3 pb-2 pt-5">
              <div>
                <p className="text-xs text-gray-500">
                  Ready for your next journey?
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  Choose your perfect ride
                </p>
              </div>

              <a
                href="/cars"
                className="rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400 transition hover:bg-blue-500/20"
              >
                Explore →
              </a>
            </div>
          </div>

          {/* Floating Bottom Badge */}
          <div className="absolute -bottom-7 -right-7 rounded-2xl border border-white/10 bg-slate-900/90 px-5 py-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-400/10">
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              </div>

              <div>
                <p className="text-xs text-gray-500">Availability</p>
                <p className="text-sm font-semibold text-white">
                  Cars ready to rent
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom Fade */}
    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
  </section>

  {/* ================= HOW IT WORKS ================= */}
  <section
    id="how-it-works"
    className="relative overflow-hidden bg-white py-24"
  >
    <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-100/40 blur-3xl" />

    <div className="relative mx-auto max-w-7xl px-6">
      {/* Section Header */}
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-500">
          Simple process
        </p>

        <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Your ride in three steps
        </h2>

        <p className="mt-5 text-lg leading-7 text-gray-500">
          From choosing your car to hitting the road, we keep the entire
          rental experience simple.
        </p>
      </div>

      {/* Steps */}
      <div className="relative mt-16 grid gap-6 md:grid-cols-3">
        {[
          {
            number: "01",
            title: "Choose your car",
            description:
              "Browse our collection and find the vehicle that matches your style, budget, and needs.",
          },
          {
            number: "02",
            title: "Make your booking",
            description:
              "Select your rental dates, pickup location, and complete your reservation in minutes.",
          },
          {
            number: "03",
            title: "Enjoy your ride",
            description:
              "Pick up your car and enjoy a smooth, comfortable, and hassle-free journey.",
          },
        ].map((step) => (
          <div
            key={step.number}
            className="group relative rounded-3xl border border-gray-100 bg-gray-50 p-8 transition duration-300 hover:-translate-y-2 hover:border-blue-100 hover:bg-white hover:shadow-2xl hover:shadow-blue-500/10"
          >
            <div className="flex items-start justify-between">
              <span className="text-sm font-bold tracking-widest text-blue-500">
                {step.number}
              </span>

              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 transition group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-500">
                →
              </div>
            </div>

            <h3 className="mt-8 text-2xl font-bold text-slate-900">
              {step.title}
            </h3>

            <p className="mt-4 leading-7 text-gray-500">
              {step.description}
            </p>

            <div className="mt-8 h-1 w-12 rounded-full bg-blue-500 transition-all duration-300 group-hover:w-20" />
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* ================= CTA ================= */}
  <section className="relative overflow-hidden bg-slate-950 py-24">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.16),transparent_45%)]" />

    <div className="relative mx-auto max-w-4xl px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
        Ready to drive?
      </p>

      <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
        Find the car that fits your journey.
      </h2>

      <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-400">
        Explore our collection or let our AI Car Finder recommend the
        perfect vehicle based on your needs.
      </p>

      <div className="mt-9 flex flex-wrap justify-center gap-4">
        <a
          href="/cars"
          className="rounded-full bg-blue-500 px-7 py-3.5 font-semibold text-white shadow-xl shadow-blue-500/20 transition hover:bg-blue-600"
        >
          Browse Cars
        </a>

        <a
          href="/recommendations"
          className="rounded-full border border-white/10 bg-white/5 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10"
        >
          AI Car Finder
        </a>
      </div>
    </div>
  </section>
</main>
);
}
