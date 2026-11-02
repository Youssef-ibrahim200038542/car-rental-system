import Link from "next/link";
import type { ReactNode } from "react";

export type BackLink = { href: string; label: string };

export function BackLinkButton({ href, label }: BackLink) {
  return (
    <Link
      href={href}
      className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#687269] transition hover:text-[#9a783c]"
    >
      <span aria-hidden="true">←</span>
      {label}
    </Link>
  );
}

/** Back link, eyebrow pill, title, description and the page's actions. */
export function PageHeader({
  back,
  eyebrow,
  title,
  description,
  actions,
}: {
  back?: BackLink;
  eyebrow: string;
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8">
      {back && <BackLinkButton {...back} />}

      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#e7dcc4] bg-[#f3ead7] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#806331]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c6a15b]" />
            {eyebrow}
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#0a1411] sm:text-4xl">
            {title}
          </h1>

          {description && (
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#73786f] sm:text-base">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </div>
  );
}
