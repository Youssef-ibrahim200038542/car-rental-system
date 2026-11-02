import Link from "next/link";
import type { Role } from "@/lib/types";

const navLinkClass =
  "whitespace-nowrap text-sm font-medium text-[#f3efe6]/75 transition-colors duration-200 hover:text-[#d4af6a]";

const pillClass =
  "inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[#d4af6a]/35 bg-[#d4af6a]/10 px-4 py-2 text-sm font-semibold text-[#e7cb91] transition-all duration-200 hover:border-[#d4af6a]/70 hover:bg-[#d4af6a]/20";

type NavLinksProps = {
  role?: Role;
  /** Called after any link is followed (closes the mobile menu). */
  onNavigate: () => void;
  /** The admin entry is a gold pill on desktop and a plain link in the mobile menu. */
  variant: "desktop" | "mobile";
};

/** The links each role sees in the top bar. */
export default function NavLinks({ role, onNavigate, variant }: NavLinksProps) {
  const link = (href: string, label: string) => (
    <Link key={href} href={href} onClick={onNavigate} className={navLinkClass}>
      {label}
    </Link>
  );

  return (
    <>
      {link("/", "Home")}

      {role === "customer" && (
        <>
          {link("/cars", "Cars")}
          {link("/bookings", "My Bookings")}
          <Link href="/recommendations" onClick={onNavigate} className={`group ${pillClass}`}>
            <svg
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
        </>
      )}

      {role === "staff" && (
        <>
          {link("/staff", "Staff Dashboard")}
          {link("/admin/bookings", "Manage Bookings")}
        </>
      )}

      {role === "admin" &&
        (variant === "desktop" ? (
          <Link href="/admin" onClick={onNavigate} className={pillClass}>
            Admin Dashboard
          </Link>
        ) : (
          link("/admin", "Admin Dashboard")
        ))}
    </>
  );
}

/** Login / Get Started for signed-out visitors. */
export function GuestLinks({ onNavigate, variant }: Omit<NavLinksProps, "role">) {
  if (variant === "mobile") {
    return (
      <div className="flex flex-col gap-3">
        <Link href="/login" onClick={onNavigate} className={navLinkClass}>
          Login
        </Link>
        <Link
          href="/register"
          onClick={onNavigate}
          className="rounded-full bg-[#d4af6a] px-5 py-3 text-center text-sm font-semibold text-[#0a1411] transition-colors hover:bg-[#e6c585]"
        >
          Get Started
        </Link>
      </div>
    );
  }

  return (
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
  );
}
