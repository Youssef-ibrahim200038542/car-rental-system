"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const categories = [
  { label: "Luxury", note: "BMW, Mercedes, Audi", type: "luxury" },
  { label: "SUV", note: "Space for the whole family", type: "suv" },
  { label: "Sport", note: "For the thrill of it", type: "sport" },
  { label: "Economy", note: "Best price per day", type: "economy" },
];

const steps = [
  {
    title: "Choose your car",
    text: "Browse our collection and find the vehicle that matches your style, budget, and needs.",
  },
  {
    title: "Make your booking",
    text: "Select your rental dates, pickup location, and complete your reservation in minutes.",
  },
  {
    title: "Enjoy your ride",
    text: "Pick up your car and enjoy a smooth, comfortable, and hassle-free journey.",
  },
];

const perks = [
  {
    title: "Transparent pricing",
    text: "Explore the available cars and review their daily rates before booking.",
  },
  {
    title: "Flexible pickup",
    text: "Choose a pickup branch that suits your journey.",
  },
  {
    title: "Easy booking",
    text: "Choose your vehicle and submit your booking through a simple process.",
  },
  {
    title: "Find your ideal car",
    text: "Use the AI Car Finder to discover vehicles that match your preferences.",
  },
];

export default function Home() {
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const [search, setSearch] = useState({
    pickup: "",
    from: "",
    to: "",
    seats: "any",
  });

  const [heroFailed, setHeroFailed] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");

      setIsLoggedIn(Boolean(token && user));
      setAuthChecked(true);
    };

    checkAuth();

    window.addEventListener("storage", checkAuth);
    window.addEventListener("auth-changed", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("auth-changed", checkAuth);
    };
  }, []);

  const getDestination = (path: string) => {
    if (!authChecked) return "/login";
    return isLoggedIn ? path : "/login";
  };

  const today = new Date().toLocaleDateString("en-CA");

  const submitSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (search.pickup.trim()) {
      params.set("pickup", search.pickup.trim());
    }

    if (search.from) {
      params.set("from", search.from);
    }

    if (search.to) {
      params.set("to", search.to);
    }

    if (search.seats !== "any") {
      params.set("seats", search.seats);
    }

    const queryString = params.toString();
    const destination = getDestination("/cars");

    if (destination !== "/cars") {
      router.push(destination);
      return;
    }

    router.push(queryString ? `/cars?${queryString}` : "/cars");
  };

  const field =
    "w-full rounded-xl border border-[#e7e0d2] bg-[#f8f6f0] px-4 py-3.5 text-sm text-[#12201b] outline-none transition placeholder:text-[#12201b]/40 focus:border-[#b8893f] focus:bg-white focus:ring-2 focus:ring-[#b8893f]/15";

  const navigateToCars = () => {
    router.push(getDestination("/cars"));
  };

  return (
    <main className="overflow-hidden bg-[#f3efe6] text-[#12201b]">
      
      

{/* HERO */}
<section className="relative overflow-hidden bg-[#0a1411] text-[#f3efe6]">
  <img
    src="http://127.0.0.1:8000/images/cars/bmw-m4.jpg"
    alt="BMW M4 available for rent"
    onLoad={() => console.log("BMW Hero image loaded successfully")}
    onError={(e) => {
      console.error("BMW Hero image failed:", e.currentTarget.src);
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
        <span className="mt-2 block text-[#d4af6a]">
          ready when you are.
        </span>
      </h1>

      <p className="mt-7 max-w-xl text-base leading-8 text-[#f3efe6]/70 sm:text-lg">
        Discover the right vehicle for your next trip with flexible
        rentals, clear daily prices, and a straightforward booking
        experience.
      </p>

      <div className="mt-9 flex flex-wrap items-center gap-3">
        <Link
          href={getDestination("/cars")}
          className="group inline-flex items-center gap-3 rounded-full bg-[#d4af6a] px-7 py-3.5 text-sm font-semibold text-[#0a1411] transition duration-300 hover:-translate-y-0.5 hover:bg-[#e6c585]"
        >
          Browse cars
          <span className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </Link>

        <Link
          href={getDestination("/recommendations")}
          className="inline-flex items-center gap-3 rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition duration-300 hover:border-[#d4af6a] hover:bg-white/10"
        >
          Help me choose
          <span className="text-[#d4af6a]">→</span>
        </Link>
      </div>

      <div className="mt-14 flex flex-wrap gap-x-10 gap-y-5 border-t border-white/15 pt-7">
        {[
          ["100+", "Cars available"],
          ["5+", "Pickup branches"],
          ["24/7", "Support"],
        ].map(([value, label]) => (
          <div key={label}>
            <p className="text-2xl font-semibold text-[#d4af6a] sm:text-3xl">
              {value}
            </p>
            <p className="mt-1 text-sm text-white/60">{label}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
</section>



      {/* BOOKING SEARCH */}
      <section className="relative z-10 mx-auto -mt-24 max-w-[1300px] px-5 sm:px-8 lg:-mt-28 lg:px-12">
        <form
          onSubmit={submitSearch}
          className="grid gap-4 rounded-3xl border border-[#e8e0d1] bg-white p-5 shadow-2xl shadow-[#12201b]/10 sm:grid-cols-2 sm:p-7 lg:grid-cols-[1.3fr_1fr_1fr_0.8fr_auto] lg:items-end"
        >
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-[#12201b]/65">
              Pickup branch
            </span>
            <input
              className={field}
              placeholder="City or branch"
              value={search.pickup}
              onChange={(e) =>
                setSearch({ ...search, pickup: e.target.value })
              }
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-[#12201b]/65">
              Pickup date
            </span>
            <input
              type="date"
              min={today}
              className={field}
              value={search.from}
              onChange={(e) =>
                setSearch({
                  ...search,
                  from: e.target.value,
                  to:
                    search.to && search.to < e.target.value
                      ? ""
                      : search.to,
                })
              }
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-[#12201b]/65">
              Return date
            </span>
            <input
              type="date"
              min={search.from || today}
              className={field}
              value={search.to}
              onChange={(e) =>
                setSearch({ ...search, to: e.target.value })
              }
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-[#12201b]/65">
              Seats
            </span>
            <select
              className={field}
              value={search.seats}
              onChange={(e) =>
                setSearch({ ...search, seats: e.target.value })
              }
            >
              <option value="any">Any</option>
              <option value="2">2 seats</option>
              <option value="4">4 seats</option>
              <option value="5">5 seats</option>
              <option value="7">7+ seats</option>
            </select>
          </label>

          <button
            type="submit"
            className="rounded-xl bg-[#12201b] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1f3a30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8893f] sm:col-span-2 lg:col-span-1"
          >
            Search cars
            <span className="ml-2 text-[#d4af6a]">→</span>
          </button>
        </form>
      </section>

      {/* CATEGORIES */}
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
            href={getDestination("/cars")}
            className="text-sm font-semibold text-[#12201b] underline decoration-[#b8893f] decoration-2 underline-offset-4 transition hover:text-[#806329]"
          >
            View all cars →
          </Link>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => (
            <Link
              key={category.type}
              href={getDestination(`/cars?type=${category.type}`)}
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

      {/* FEATURED CAR + AI FINDER */}
      <section className="mx-auto grid max-w-[1300px] gap-5 px-5 pb-20 sm:px-8 lg:grid-cols-[1.4fr_1fr] lg:px-12 lg:pb-24">
        

<article className="relative min-h-[440px] overflow-hidden rounded-3xl bg-[#0a1411] text-white">
  <img
    src="http://127.0.0.1:8000/images/cars/bmw-m4.jpg"
    alt="BMW M4"
    className="absolute inset-0 h-full w-full object-cover"
    onLoad={() => console.log("BMW image loaded successfully")}
    onError={(e) => console.error("BMW image failed:", e.currentTarget.src)}
  />

  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1411] via-[#0a1411]/40 to-transparent" />

  <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end justify-between gap-5 p-7 sm:p-9">
    <div>
      <p className="text-sm font-semibold text-[#d4af6a]">
        Featured vehicle
      </p>
      <h3 className="mt-2 text-4xl font-semibold tracking-tight">
        BMW M4
      </h3>
      <ul className="mt-4 flex flex-wrap gap-2 text-xs">
        {["Luxury", "Automatic", "4 seats"].map((item) => (
          <li
            key={item}
            className="rounded-full border border-white/25 px-3 py-1.5"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>

    <div>
      <p className="text-3xl font-semibold">4,500</p>
      <p className="mt-1 text-xs text-white/65">EGP per day</p>
      <button
        type="button"
        onClick={navigateToCars}
        className="mt-4 rounded-full bg-[#d4af6a] px-6 py-3 text-sm font-semibold text-[#0a1411] hover:bg-[#e6c585]"
      >
        Explore cars →
      </button>
    </div>
  </div>
</article>



        <aside className="flex flex-col justify-between rounded-3xl bg-[#1a3a2e] p-7 text-[#f3efe6] sm:p-9">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af6a]">
              AI Car Finder
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Not sure which car fits?
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/70">
              Tell us your budget, how many people are travelling, and the
              style you prefer. Discover cars that match your needs.
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
              href={getDestination("/recommendations")}
              className="inline-flex items-center gap-3 rounded-full bg-[#f3efe6] px-6 py-3 text-sm font-semibold text-[#12201b] transition hover:bg-white"
            >
              Find my car
              <span>→</span>
            </Link>
          </div>
        </aside>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="bg-[#12201b] py-20 text-[#f3efe6] lg:py-24"
      >
        <div className="mx-auto max-w-[1300px] px-5 sm:px-8 lg:px-12">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d4af6a]">
            The process
          </p>

          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            From choosing to driving in three steps.
          </h2>

          <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="relative border-t border-white/20 pt-7"
              >
                <span className="absolute -top-3 left-0 bg-[#12201b] pr-3 text-sm font-semibold text-[#d4af6a]">
                  STEP 0{index + 1}
                </span>

                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-7 text-white/65">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* WHY DRIVEX */}
      <section className="mx-auto max-w-[1300px] px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ad8845]">
          The DriveX difference
        </p>

        <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Renting should feel easy.
        </h2>

        <dl className="mt-10 grid gap-x-12 gap-y-9 sm:grid-cols-2">
          {perks.map((perk, index) => (
            <div
              key={perk.title}
              className="flex gap-4 border-t border-[#12201b]/10 pt-5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8dfca] text-sm font-bold text-[#806329]">
                0{index + 1}
              </span>

              <div>
                <dt className="text-lg font-semibold">{perk.title}</dt>
                <dd className="mt-2 max-w-md text-sm leading-7 text-[#12201b]/65">
                  {perk.text}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/* FINAL CTA */}
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
              href={getDestination("/cars")}
              className="rounded-full bg-[#d4af6a] px-7 py-3.5 text-sm font-semibold text-[#0a1411] transition hover:bg-[#e6c585]"
            >
              Browse cars
            </Link>

            <Link
              href={getDestination("/recommendations")}
              className="rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold transition hover:border-[#d4af6a] hover:bg-white/5"
            >
              Help me choose
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}