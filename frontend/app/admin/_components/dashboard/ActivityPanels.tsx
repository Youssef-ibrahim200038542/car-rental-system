import Link from "next/link";
import type { Payment, Review } from "@/lib/types";
import { formatAmount, formatDate, initial } from "../../_lib/format";
import { Icon } from "../icons";
import { DashboardPanel, panelFooterLinkClass, panelLinkClass } from "./DashboardChrome";

export function PaymentSummaryPanel({
  revenue,
  payments,
}: {
  revenue: number;
  payments: Payment[];
}) {
  const count = (status: Payment["payment_status"]) =>
    payments.filter((payment) => payment.payment_status === status).length;

  return (
    <DashboardPanel eyebrow="Financial overview" title="Payment summary">
      <div className="rounded-2xl bg-[#0a1411] p-5 text-white">
        <p className="text-sm text-[#b2bdb5]">Collected revenue</p>
        <p className="mt-2 break-words text-3xl font-extrabold">
          {formatAmount(revenue)}{" "}
          <span className="text-sm font-medium text-[#b2bdb5]">EGP</span>
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs text-[#d9bc7d]">
          <Icon name="check" className="h-4 w-4" />
          {count("paid")} successful payment records
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#e6deca] bg-[#faf7ef] p-4">
          <p className="text-xs text-[#765b2d]">Pending payments</p>
          <p className="mt-2 text-2xl font-extrabold text-[#17251e]">{count("pending")}</p>
        </div>
        <div className="rounded-xl border border-[#e2e3db] bg-[#f7f7f2] p-4">
          <p className="text-xs text-[#536157]">All payment records</p>
          <p className="mt-2 text-2xl font-extrabold text-[#17251e]">{payments.length}</p>
        </div>
      </div>

      <Link href="/admin/payments" className={panelFooterLinkClass}>
        Open payments <Icon name="arrow" className="h-4 w-4" />
      </Link>
    </DashboardPanel>
  );
}

function newestReviews(reviews: Review[], count: number): Review[] {
  const createdAt = (review: Review) => new Date(review.created_at ?? 0).getTime();
  return [...reviews].sort((a, b) => createdAt(b) - createdAt(a)).slice(0, count);
}

export function LatestReviewsPanel({
  reviews,
  total,
  averageRating,
}: {
  reviews: Review[];
  total: number;
  averageRating: number;
}) {
  const latest = newestReviews(reviews, 3);

  return (
    <DashboardPanel
      eyebrow="Customer feedback"
      title="Latest reviews"
      action={
        <Link href="/admin/reviews" className={panelLinkClass}>
          View all ↗
        </Link>
      }
    >
      <div className="mb-5 flex items-center gap-4 rounded-2xl bg-[#faf7ef] p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#c6a15b] shadow-sm">
          <Icon name="star" className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-extrabold text-[#17251e]">
            {total ? averageRating.toFixed(1) : "—"}
            <span className="ml-1 text-sm font-medium text-[#929990]">/ 5</span>
          </p>
          <p className="text-xs text-[#788078]">Average rating from {total} reviews</p>
        </div>
      </div>

      {latest.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#e2e3db] py-8 text-center text-sm text-[#929990]">
          No customer reviews yet.
        </div>
      ) : (
        <div className="space-y-3">
          {latest.map((review) => (
            <div key={review.id} className="rounded-xl border border-[#eeeee8] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eee8da] text-sm font-bold text-[#765b2d]">
                    {initial(review.user?.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#17251e]">
                      {review.user?.name || "Customer"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#929990]">{formatDate(review.created_at)}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-lg bg-[#faf7ef] px-2 py-1 text-xs font-bold text-[#9a783c]">
                  ★ {review.rating}/5
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#788078]">
                {review.comment || "No comment provided."}
              </p>
            </div>
          ))}
        </div>
      )}
    </DashboardPanel>
  );
}
