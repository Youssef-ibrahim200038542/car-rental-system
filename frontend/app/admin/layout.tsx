"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRequireRole } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { PageState } from "../components/StateViews";
import { Icon, type IconName } from "./_components/icons";

const navigation: { href: string; label: string; icon: IconName; roles: Role[] }[] = [
  { href: "/admin", label: "Overview", icon: "grid", roles: ["admin"] },
  { href: "/admin/cars", label: "Fleet Management", icon: "car", roles: ["admin"] },
  { href: "/admin/bookings", label: "Bookings", icon: "calendar", roles: ["admin", "staff"] },
  { href: "/admin/payments", label: "Payments", icon: "wallet", roles: ["admin", "staff"] },
  { href: "/admin/branches", label: "Branches", icon: "branch", roles: ["admin"] },
  { href: "/admin/users", label: "Customers & Users", icon: "users", roles: ["admin"] },
  { href: "/admin/reviews", label: "Reviews", icon: "star", roles: ["admin"] },
];

const ADMIN_AREA_ROLES: Role[] = ["admin", "staff"];

/** Staff may only use the sections the API grants them (bookings, payments). */
const STAFF_PATHS = ["/admin/bookings", "/admin/payments"];

function canAccessPath(role: Role | undefined, pathname: string) {
  if (role === "admin") return true;
  if (role === "staff") {
    return STAFF_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
  }
  return false;
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useRequireRole(ADMIN_AREA_ROLES);
  const user = auth.user;
  const pathAllowed = auth.status === "allowed" && canAccessPath(user?.role, pathname);

  useEffect(() => {
    if (auth.status === "allowed" && !pathAllowed) {
      router.replace(user?.role === "staff" ? "/staff" : "/");
    }
  }, [auth.status, pathAllowed, router, user?.role]);

  if (auth.status === "error") {
    return (
      <PageState
        tone="error"
        title="Unable to verify your session"
        message={auth.message}
        action={{ label: "Try Again", onClick: auth.retry }}
      />
    );
  }

  if (!pathAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8f7]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#e8e5dc] border-t-[#c6a15b]" />
      </div>
    );
  }

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
            {navigation
              .filter((item) => user?.role && item.roles.includes(user.role))
              .map((item) => {
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
          {user?.role === "admin" && (
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
          )}

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
