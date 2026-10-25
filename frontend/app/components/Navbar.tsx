
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "customer" | "staff";
};

const navLinkClass =
  "whitespace-nowrap text-sm font-medium text-[#f3efe6]/75 transition-colors duration-200 hover:text-[#d4af6a]";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const syncUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token || !apiUrl) {
      setUser(null);
      setAuthChecked(true);
      return;
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as User);
      } catch {
        localStorage.removeItem("user");
        setUser(null);
      }
    }

    try {
      const response = await fetch(`${apiUrl}/me`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }

        setAuthChecked(true);
        return;
      }

      const result = await response.json();
      const freshUser = result?.data?.user as User | undefined;

      if (
        !freshUser ||
        typeof freshUser.id !== "number" ||
        typeof freshUser.name !== "string" ||
        !["admin", "customer", "staff"].includes(freshUser.role)
      ) {
        setAuthChecked(true);
        return;
      }

      setUser(freshUser);
      localStorage.setItem("user", JSON.stringify(freshUser));
    } catch (error) {
      console.error("Failed to refresh user:", error);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    void syncUser();

    const handleAuthChanged = () => {
      void syncUser();
    };

    window.addEventListener("storage", handleAuthChanged);
    window.addEventListener("auth-changed", handleAuthChanged);

    return () => {
      window.removeEventListener("storage", handleAuthChanged);
      window.removeEventListener("auth-changed", handleAuthChanged);
    };
  }, [syncUser]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    try {
      if (token && apiUrl) {
        await fetch(`${apiUrl}/logout`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      closeMobileMenu();
      window.dispatchEvent(new Event("auth-changed"));
      window.location.href = "/";
    }
  };

  const renderLink = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      onClick={closeMobileMenu}
      className={navLinkClass}
    >
      {label}
    </Link>
  );

  const recommendationLink = (
    <Link
      href="/recommendations"
      onClick={closeMobileMenu}
      className="group inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[#d4af6a]/35 bg-[#d4af6a]/10 px-4 py-2 text-sm font-semibold text-[#e7cb91] transition-all duration-200 hover:border-[#d4af6a]/70 hover:bg-[#d4af6a]/20"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v3m0 12v3M3 12h3m12 0h3M5.64 5.64l2.12 2.12m8.48 8.48 2.12 2.12m0-12.72-2.12 2.12m-8.48 8.48-2.12 2.12"
        />
        <circle cx="12" cy="12" r="4" />
      </svg>
      AI Car Finder
    </Link>
  );

  const renderUserInfo = (compact = false) => (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d4af6a]/40 bg-[#d4af6a]/10 text-sm font-bold text-[#e7cb91]">
        {user?.name.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0">
        <p
          className={`truncate text-sm font-semibold text-[#f3efe6] ${
            compact ? "" : "max-w-[130px]"
          }`}
        >
          {user?.name}
        </p>
        <p className="text-xs capitalize text-[#f3efe6]/50">
          {user?.role}
        </p>
      </div>
    </div>
  );

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
          {renderLink("/", "Home")}

          {user?.role === "customer" && (
            <>
              {renderLink("/cars", "Cars")}
              {renderLink("/bookings", "My Bookings")}
              {recommendationLink}
            </>
          )}

          {user?.role === "staff" && (
            <>
              {renderLink("/staff", "Staff Dashboard")}
              {renderLink("/admin/bookings", "Manage Bookings")}
            </>
          )}

          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="whitespace-nowrap rounded-full border border-[#d4af6a]/35 bg-[#d4af6a]/10 px-4 py-2 text-sm font-semibold text-[#e7cb91] transition-colors hover:bg-[#d4af6a]/20"
            >
              Admin Dashboard
            </Link>
          )}
        </div>

        <div className="hidden shrink-0 items-center gap-3 md:flex">
          {!authChecked ? null : !user ? (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2.5 text-sm font-semibold text-[#f3efe6]/75 transition-colors hover:text-[#d4af6a]"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-full bg-[#d4af6a] px-5 py-2.5 text-sm font-semibold text-[#0a1411] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e6c585] hover:shadow-md"
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              {renderUserInfo()}

              <button
                type="button"
                onClick={() => void handleLogout()}
                className="whitespace-nowrap rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-[#f3efe6]/75 transition-all hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
              >
                Logout
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#f3efe6] transition-colors hover:border-[#d4af6a]/50 hover:text-[#d4af6a] md:hidden"
        >
          {mobileMenuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
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
                d="m6 6 12 12M18 6 6 18"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
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
                d="M4 7h16M4 12h16M4 17h16"
              />
            </svg>
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-[#0a1411] px-5 py-5 shadow-xl md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col items-stretch gap-5">
            {renderLink("/", "Home")}

            {user?.role === "customer" && (
              <>
                {renderLink("/cars", "Cars")}
                {renderLink("/bookings", "My Bookings")}
                {recommendationLink}
              </>
            )}

            {user?.role === "staff" && (
              <>
                {renderLink("/staff", "Staff Dashboard")}
                {renderLink("/admin/bookings", "Manage Bookings")}
              </>
            )}

            {user?.role === "admin" && renderLink("/admin", "Admin Dashboard")}

            <div className="border-t border-white/10 pt-4">
              {!authChecked ? null : !user ? (
                <div className="flex flex-col gap-3">
                  {renderLink("/login", "Login")}

                  <Link
                    href="/register"
                    onClick={closeMobileMenu}
                    className="rounded-full bg-[#d4af6a] px-5 py-3 text-center text-sm font-semibold text-[#0a1411] transition-colors hover:bg-[#e6c585]"
                  >
                    Get Started
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {renderUserInfo(true)}

                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="w-full rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-[#f3efe6]/75 transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
