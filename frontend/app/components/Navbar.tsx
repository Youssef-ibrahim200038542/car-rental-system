"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AUTH_CHANGED_EVENT, apiFetch, clearSession, getToken } from "@/lib/api";
import { fetchCurrentUser, useHydrated, useSessionUser } from "@/lib/auth";
import NavLinks, { GuestLinks } from "./NavLinks";
import NavUser from "./NavUser";

/** Re-validate the cached user against /me; apiFetch clears the session on 401. */
function refreshSessionUser() {
  if (!getToken()) return;
  fetchCurrentUser().catch((error: unknown) => {
    console.error("Failed to refresh user:", error);
  });
}

export default function Navbar() {
  const router = useRouter();
  const user = useSessionUser();
  const authChecked = useHydrated();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    refreshSessionUser();
    window.addEventListener(AUTH_CHANGED_EVENT, refreshSessionUser);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, refreshSessionUser);
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = async () => {
    try {
      if (getToken()) await apiFetch("/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      clearSession();
      closeMobileMenu();
      router.push("/");
    }
  };

  const session = (variant: "desktop" | "mobile") => {
    if (!authChecked) return null;
    if (!user) return <GuestLinks onNavigate={closeMobileMenu} variant={variant} />;
    return <NavUser user={user} onLogout={() => void handleLogout()} variant={variant} />;
  };

  return (
    <nav className="absolute left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#0a1411]/90 text-[#f3efe6] shadow-lg shadow-black/10 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          onClick={closeMobileMenu}
          className="group flex shrink-0 items-center text-2xl font-extrabold tracking-tight text-[#f3efe6]"
        >
          Drive
          <span className="text-[#d4af6a] transition-colors duration-200 group-hover:text-[#e6c585]">
            X
          </span>
          <span className="ml-2 hidden text-[10px] font-semibold uppercase tracking-[0.24em] text-[#f3efe6]/45 sm:inline">
            Rental
          </span>
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          <NavLinks role={user?.role} onNavigate={closeMobileMenu} variant="desktop" />
        </div>

        <div className="hidden shrink-0 items-center gap-3 md:flex">{session("desktop")}</div>

        <button
          type="button"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#f3efe6] transition-colors hover:border-[#d4af6a]/50 hover:text-[#d4af6a] md:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={mobileMenuOpen ? "m6 6 12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"}
            />
          </svg>
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-[#0a1411] px-5 py-5 shadow-xl md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col items-stretch gap-5">
            <NavLinks role={user?.role} onNavigate={closeMobileMenu} variant="mobile" />
            <div className="border-t border-white/10 pt-4">{session("mobile")}</div>
          </div>
        </div>
      )}
    </nav>
  );
}
