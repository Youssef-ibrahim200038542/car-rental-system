import Link from "next/link";
import type { Branch } from "@/lib/types";
import { Icon } from "../../_components/icons";

export function BranchCard({
  branch,
  deleting,
  onDelete,
}: {
  branch: Branch;
  deleting: boolean;
  onDelete: (branch: Branch) => void;
}) {
  return (
    <article className="group border-b border-[#eeece5] p-5 transition hover:bg-[#fcfbf7] sm:p-6 xl:[&:not(:nth-child(3n+1))]:border-l">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c6a15b]/20 bg-[#c6a15b]/10 text-[#9a783c]">
          <Icon name="branch" className="h-6 w-6" strokeWidth={1.6} />
        </div>
        <span className="rounded-full border border-[#1a3027]/15 bg-[#1a3027]/5 px-3 py-1 text-xs font-semibold text-[#1a3027]">
          Branch #{branch.id}
        </span>
      </div>

      <h3 className="break-words text-lg font-bold text-[#0a1411] transition group-hover:text-[#9a783c]">
        {branch.name}
      </h3>

      <div className="mt-4 space-y-3">
        <div className="flex items-start gap-3">
          <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-[#9a783c]" />
          <p className="break-words text-sm leading-6 text-[#68736c]">
            {branch.address || "No address provided"}
            {branch.city ? `, ${branch.city}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Icon name="phone" className="h-4 w-4 shrink-0 text-[#9a783c]" />
          <p className="break-all text-sm text-[#68736c]">
            {branch.phone || "No phone provided"}
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-2 border-t border-[#eeece5] pt-5">
        <Link
          href={`/admin/branches/${branch.id}/edit`}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#c6a15b]/35 bg-[#c6a15b]/10 px-3 py-2.5 text-sm font-semibold text-[#80612c] transition hover:border-[#c6a15b] hover:bg-[#c6a15b] hover:text-[#0a1411]"
        >
          <Icon name="pencil" className="h-4 w-4" strokeWidth={1.8} />
          Edit Branch
        </Link>

        <button
          type="button"
          onClick={() => onDelete(branch)}
          disabled={deleting}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-700" />
          ) : (
            <Icon name="trash" className="h-4 w-4" strokeWidth={1.8} />
          )}
          {deleting ? "Deleting" : "Delete"}
        </button>
      </div>
    </article>
  );
}
