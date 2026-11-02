import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  /** Right-aligned content on wide screens (a summary chip, a link). */
  aside?: ReactNode;
  /** "page" for the h1 at the top of a page, "section" for an h2 inside one. */
  level?: "page" | "section";
  description?: ReactNode;
};

/** Gold rule + eyebrow + heading — the header rhythm used across customer pages. */
export default function SectionHeader({
  eyebrow,
  title,
  aside,
  level = "section",
  description,
}: SectionHeaderProps) {
  const Heading = level === "page" ? "h1" : "h2";

  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span className="h-[2px] w-7 bg-[#c6a15b]" />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a783c]">
            {eyebrow}
          </span>
        </div>

        <Heading
          className={
            level === "page"
              ? "text-4xl font-bold tracking-tight text-[#0a1411] md:text-5xl"
              : "text-2xl font-bold text-[#0a1411] sm:text-3xl"
          }
        >
          {title}
        </Heading>

        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#77776f] sm:text-base">
            {description}
          </p>
        )}
      </div>

      {aside}
    </div>
  );
}
