"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = {
id: number;
name: string;
email: string;
role: "admin" | "customer" | "staff";
};

export default function Navbar() {
const [user, setUser] = useState<User | null>(null);

useEffect(() => {
const storedUser = localStorage.getItem("user");


if (storedUser) {
  try {
    setUser(JSON.parse(storedUser));
  } catch {
    localStorage.removeItem("user");
  }
}


}, []);

const handleLogout = () => {
const token = localStorage.getItem("token");
const apiUrl = process.env.NEXT_PUBLIC_API_URL;


if (token) {
  fetch(apiUrl + "/logout", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + token,
    },
  }).catch(() => {});
}

localStorage.removeItem("token");
localStorage.removeItem("user");

setUser(null);

window.location.href = "/";


};

return ( <nav className="absolute left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-xl"> <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">


    {/* Logo */}
    <Link
      href="/"
      className="group text-2xl font-bold tracking-tight text-white"
    >
      Drive
      <span className="text-blue-400 transition group-hover:text-blue-300">
        X
      </span>
    </Link>

    {/* Navigation */}
    <div className="hidden items-center gap-7 md:flex">

      <Link
        href="/"
        className="text-sm font-medium text-gray-300 transition duration-200 hover:text-white"
      >
        Home
      </Link>

      <Link
        href="/cars"
        className="text-sm font-medium text-gray-300 transition duration-200 hover:text-white"
      >
        Cars
      </Link>

      {user && user.role !== "admin" && (
        <>
          <Link
            href="/bookings"
            className="text-sm font-medium text-gray-300 transition duration-200 hover:text-white"
          >
            My Bookings
          </Link>

          {/* Featured AI Recommendation */}
          <Link
            href="/recommendations"
            className="group relative flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 shadow-lg shadow-blue-500/5 transition-all duration-300 hover:border-blue-400/40 hover:bg-blue-500/20 hover:text-blue-200 hover:shadow-blue-500/10"
          >
            {/* AI Icon */}
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 transition-transform duration-300 group-hover:scale-110">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-3.5 w-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v3m0 12v3M3 12h3m12 0h3M5.64 5.64l2.12 2.12m8.48 8.48 2.12 2.12m0-12.72-2.12 2.12m-8.48 8.48-2.12 2.12"
                />
                <circle cx="12" cy="12" r="4" />
              </svg>
            </span>

            <span>AI Car Finder</span>

            {/* Small live indicator */}
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-400"></span>
            </span>
          </Link>
        </>
      )}

      {user?.role === "admin" && (
        <Link
          href="/admin"
          className="rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 transition-all duration-300 hover:border-blue-400/40 hover:bg-blue-500/20 hover:text-blue-200"
        >
          Admin Dashboard
        </Link>
      )}

    </div>

    {/* Right Side */}
    <div className="flex items-center gap-3">

      {!user ? (
        <>
          <Link
            href="/login"
            className="rounded-full px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 hover:shadow-blue-500/30"
          >
            Get Started
          </Link>
        </>
      ) : (
        <>
          <div className="hidden items-center gap-3 sm:flex">

            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/10 text-sm font-bold text-blue-400">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <span className="max-w-[140px] truncate text-sm font-medium text-white">
              {user.name}
            </span>

          </div>

          <button
            onClick={handleLogout}
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-gray-300 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
          >
            Logout
          </button>
        </>
      )}

    </div>
  </div>
</nav>
);
}
