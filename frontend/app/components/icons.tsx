import type { ReactNode } from "react";

/** Stroke icons shared by the customer pages (24×24 outline set). */
export type IconName =
  | "calendar"
  | "seats"
  | "gearbox"
  | "fuel"
  | "search"
  | "car"
  | "money"
  | "alert"
  | "inbox"
  | "arrow"
  | "wallet"
  | "clock"
  | "key";

const paths: Record<IconName, ReactNode> = {
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="15" rx="2" />
      <path d="M7 3v4M17 3v4M3 10h18" />
    </>
  ),
  seats: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path
        d="M3 20v-2a6 6 0 0 1 12 0v2M16 5.5a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 3 4.6V20"
        strokeLinecap="round"
      />
    </>
  ),
  gearbox: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="m5.6 5.6 4.6 4.6m3.6 3.6 4.6 4.6M18.4 5.6l-4.6 4.6m-3.6 3.6-4.6 4.6" />
    </>
  ),
  fuel: (
    <path
      d="M12 3c2.2 3.4 6 7.3 6 11a6 6 0 1 1-12 0c0-3.7 3.8-7.6 6-11Z"
      strokeLinejoin="round"
    />
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4 4" strokeLinecap="round" />
    </>
  ),
  car: (
    <>
      <path
        d="M3 13.5 5 8a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 8l2 5.5V19h-2v-2H5v2H3v-5.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5 13h14M7 10h.01M17 10h.01" strokeLinecap="round" />
    </>
  ),
  money: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v12m4-9.5c0-1.105-1.79-2-4-2s-4 .895-4 2 1.79 2 4 2 4 .895 4 2-1.79 2-4 2-4-.895-4-2"
    />
  ),
  alert: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m0 3h.008v.008H12v-.008ZM10.29 3.86 2.82 17a1.5 1.5 0 0 0 1.3 2.25h15.76a1.5 1.5 0 0 0 1.3-2.25l-7.47-13.14a1.5 1.5 0 0 0-2.61 0Z"
    />
  ),
  inbox: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 17.25V6.75Z"
    />
  ),
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />,
  wallet: (
    <>
      <rect x="3" y="5" width="18" height="15" rx="2" />
      <path d="M3 9h18M16 14h2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 9-9M17 6l2 2M15 8l2 2" strokeLinecap="round" />
    </>
  ),
};

type IconProps = {
  name: IconName;
  className?: string;
  strokeWidth?: number;
};

export default function Icon({ name, className = "h-5 w-5", strokeWidth = 1.6 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
