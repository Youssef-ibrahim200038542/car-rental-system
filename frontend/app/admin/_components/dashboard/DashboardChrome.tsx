import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "../icons";

export const panelLinkClass =
  "text-xs font-bold text-[#9a783c] transition hover:text-[#765b2d]";

export const panelFooterLinkClass =
  "mt-5 flex items-center justify-between rounded-xl border border-[#e2e3db] px-4 py-3 text-sm font-bold text-[#536157] transition hover:border-[#c6a15b] hover:bg-[#faf7ef] hover:text-[#765b2d]";

/** One white panel of the overview, with an eyebrow + title header. */
export function DashboardPanel({
  eyebrow,
  title,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#e6e6de] bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9a783c]">
            {eyebrow}
          </p>
          <h2 className="mt-1.5 text-lg font-bold tracking-tight text-[#17251e] sm:text-xl">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function WelcomeBanner({ firstName }: { firstName?: string }) {
  return (
    <section className="relative mb-8 overflow-hidden rounded-3xl bg-[#0a1411] p-6 text-white shadow-xl shadow-[#0a1411]/10 sm:p-8">
      <div className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full border-[40px] border-[#c6a15b]/10" />
      <div className="pointer-events-none absolute -bottom-24 right-40 h-48 w-48 rounded-full bg-[#c6a15b]/10 blur-2xl" />
      <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#c6a15b]/30 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#e4d1a7]">
            <span className="h-2 w-2 rounded-full bg-[#c6a15b]" />
            System operational
          </div>
          <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl">
            Welcome back{firstName ? `, ${firstName}` : ""}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#c0c9c1]">
            Monitor your fleet, keep bookings moving, and stay on top of your
            business performance.
          </p>
        </div>
        <Link
          href="/admin/bookings"
          className="inline-flex shrink-0 items-center justify-center gap-3 rounded-xl bg-[#c6a15b] px-5 py-3 text-sm font-bold text-[#17251e] shadow-lg transition hover:bg-[#d7b873]"
        >
          Review bookings <Icon name="arrow" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

const SHORTCUTS: { href: string; label: string; icon: IconName; color: string }[] = [
  { href: "/admin/cars", label: "Add or manage cars", icon: "car", color: "text-[#315b3c] bg-[#e8eee7]" },
  { href: "/admin/bookings", label: "Review bookings", icon: "calendar", color: "text-[#765b2d] bg-[#eee8da]" },
  { href: "/admin/branches", label: "Manage branches", icon: "branch", color: "text-[#315b3c] bg-[#e4eee5]" },
  { href: "/admin/users", label: "Manage users", icon: "users", color: "text-[#9a783c] bg-[#f5eee0]" },
];

export function QuickActions() {
  return (
    <section className="mt-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9a783c]">Shortcuts</p>
      <h2 className="mb-5 mt-1.5 text-lg font-bold tracking-tight text-[#17251e] sm:text-xl">
        Quick actions
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SHORTCUTS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center gap-3 rounded-2xl border border-[#e6e6de] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#c6a15b]/60 hover:shadow-md"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}>
              <Icon name={item.icon} />
            </div>
            <span className="flex-1 text-sm font-bold text-[#536157]">{item.label}</span>
            <Icon
              name="arrow"
              className="h-4 w-4 text-[#b5b9af] transition group-hover:translate-x-1 group-hover:text-[#9a783c]"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
