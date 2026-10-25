
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type AdminUser = {
  name?: string;
  role?: string;
};

const navigation = [
  { href: "/admin", label: "Overview", icon: "grid" },
  { href: "/admin/cars", label: "Fleet Management", icon: "car" },
  { href: "/admin/bookings", label: "Bookings", icon: "calendar" },
  { href: "/admin/payments", label: "Payments", icon: "wallet" },
  { href: "/admin/branches", label: "Branches", icon: "branch" },
  { href: "/admin/users", label: "Customers & Users", icon: "users" },
  { href: "/admin/reviews", label: "Reviews", icon: "star" },
];

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: string;
  className?: string;
}) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  const paths: Record<string, React.ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    car: (
      <>
        <path d="m5 11 1.5-5h11l1.5 5" />
        <path d="M3.5 13 5 11h14l1.5 2v5h-17z" />
        <path d="M6 18v2m12-2v2M6 14h.01M18 14h.01" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    wallet: (
      <>
        <rect x="3" y="5" width="18" height="15" rx="2" />
        <path d="M3 9h18M16 14h2M3 5V4a1 1 0 0 1 1-1h14" />
      </>
    ),
    branch: (
      <path d="M3 21h18M5 21V5l7-3 7 3v16M9 9h.01M15 9h.01M9 13h.01M15 13h.01M10 21v-4h4v4" />
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.3 2.3-5 6-5s6 1.7 6 5M16 5.5a3 3 0 0 1 0 5.8M18 15c2 .7 3 2.2 3 5" />
      </>
    ),
    star: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    ),
    chart: (
      <>
        <path d="M3 3v18h18" />
        <path d="m7 14 4-4 3 3 6-7" />
      </>
    ),
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  };

  return <svg {...common}>{paths[name] ?? paths.grid}</svg>;
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token) {
      router.replace("/login");
      return;
    }

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as AdminUser;
        setUser(parsedUser);

        if (parsedUser.role && parsedUser.role !== "admin") {
          router.replace("/");
        }
      } catch {
        setUser(null);
      }
    }
  }, [router]);

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="min-h-screen bg-[#f8f8f7] text-[#17251e]">
      <div className="mx-auto grid max-w-[1600px] items-start gap-6 px-4 pb-10 pt-6 sm:px-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:px-8">
        <aside className="h-fit self-start rounded-3xl border border-[#e6e6de] bg-white p-4 shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <div className="flex items-center gap-3 border-b border-[#eeeee8] px-3 pb-5 pt-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8eee7] text-lg font-black text-[#17251e]">
              D
            </div>

            <div>
              <p className="text-lg font-extrabold tracking-tight">
                Drive<span className="text-[#c6a15b]">X</span>
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a938b]">
                Management
              </p>
            </div>
          </div>

          <p className="px-3 pb-2 pt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a938b]">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors duration-200 ${
                    active
                      ? "bg-[#e8eee7] text-[#17251e]"
                      : "text-[#637168] hover:bg-[#e8eee7] hover:text-[#17251e]"
                  }`}
                >
                  <Icon
                    name={item.icon}
                    className={`h-[18px] w-[18px] transition-colors duration-200 ${
                      active
                        ? "text-[#765b2d]"
                        : "text-[#9a783c] group-hover:text-[#765b2d]"
                    }`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Fleet Performance Card */}
          <div className="mt-6 rounded-2xl border border-[#dce5da] bg-[#e8eee7] p-4 text-[#17251e]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#9a783c] shadow-sm">
              <Icon name="chart" />
            </div>

            <p className="mt-4 text-sm font-bold text-[#17251e]">
              Fleet performance
            </p>

            <p className="mt-1 text-xs leading-5 text-[#35483d]">
              Track your fleet, bookings and business activity in one place.
            </p>

            <Link
              href="/admin/cars"
              className="mt-4 flex items-center justify-between rounded-xl bg-[#c6a15b] px-3 py-2.5 text-xs font-bold text-[#17251e] transition-colors hover:bg-[#d7b873]"
            >
              Manage fleet
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 flex items-center gap-3 border-t border-[#eeeee8] px-2 pt-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eee8da] font-bold text-[#765b2d]">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold">
                {user?.name || "Administrator"}
              </p>
              <p className="text-xs capitalize text-[#8a938b]">
                {user?.role || "admin"}
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
