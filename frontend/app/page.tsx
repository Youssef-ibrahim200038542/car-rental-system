"use client";

import { useRouter } from "next/navigation";
import { useHydrated, useSessionUser } from "@/lib/auth";
import HomeCollection from "./_home/HomeCollection";
import HomeHero from "./_home/HomeHero";
import HomeSearch from "./_home/HomeSearch";
import HomeStory from "./_home/HomeStory";
import type { Destination } from "./_home/home-content";

export default function Home() {
  const router = useRouter();
  const isLoggedIn = Boolean(useSessionUser());
  const authChecked = useHydrated();

  // Guests sign in first and are then sent on to the page (and search) they picked.
  const destination: Destination = (path) =>
    authChecked && isLoggedIn ? path : `/login?redirect=${encodeURIComponent(path)}`;

  return (
    <main className="overflow-hidden bg-[#f3efe6] text-[#12201b]">
      <HomeHero destination={destination} />
      <HomeSearch onSearch={(path) => router.push(destination(path))} />
      <HomeCollection destination={destination} />
      <HomeStory destination={destination} />
    </main>
  );
}
