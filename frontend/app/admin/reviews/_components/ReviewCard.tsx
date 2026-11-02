import Link from "next/link";
import type { Review } from "@/lib/types";
import { Icon } from "../../_components/icons";
import { StatusBadge } from "../../_components/StatusBadge";
import { formatDate, initial } from "../../_lib/format";
import { buttonClass, rowActionClass } from "../../_lib/ui";

export const reviewCarName = (review: Review) =>
  `${review.car?.brand || ""} ${review.car?.model || ""}`.trim() || "Unknown Car";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-lg" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? "text-[#c6a15b]" : "text-[#ddd9cf]"}>
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewContext({ review }: { review: Review }) {
  return (
    <div className="rounded-2xl border border-[#e9e5dc] bg-[#fcfbf8] p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#85867c]">Vehicle</p>
      <p className="mt-2 font-bold text-[#0a1411]">{reviewCarName(review)}</p>
      <p className="mt-1 text-xs text-[#85867c]">Car ID #{review.car_id}</p>

      <div className="my-4 border-t border-[#e9e5dc]" />

      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#85867c]">Booking</p>
      <p className="mb-2 mt-2 text-sm font-semibold text-[#34443b]">
        Booking #{review.booking_id}
      </p>
      {review.booking?.status && <StatusBadge kind="booking" status={review.booking.status} />}

      <div className="mt-4 flex items-center gap-2 text-xs text-[#85867c]">
        <Icon name="clock" className="h-4 w-4" />
        {formatDate(review.created_at)}
      </div>
    </div>
  );
}

export function ReviewCard({
  review,
  deleting,
  onDelete,
}: {
  review: Review;
  deleting: boolean;
  onDelete: (review: Review) => void;
}) {
  const rating = Number(review.rating);

  return (
    <article className="p-5 transition hover:bg-[#fcfbf8] md:p-6">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#e7dcc4] bg-[#f3ead7] text-lg font-bold text-[#806331]">
              {initial(review.user?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-[#0a1411]">
                  {review.user?.name || "Unknown Customer"}
                </h3>
                <span className="rounded-md bg-[#f2f1ed] px-2 py-1 text-[11px] font-medium text-[#73766e]">
                  Review #{review.id}
                </span>
              </div>
              {review.user?.email && (
                <p className="mt-1 break-all text-sm text-[#85867c]">{review.user.email}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Stars rating={rating} />
                <span className="text-sm font-bold text-[#34443b]">{review.rating}/5</span>
              </div>
            </div>
          </div>

          {review.comment?.trim() ? (
            <blockquote className="mt-5 rounded-2xl border border-[#e9e5dc] bg-[#fcfbf8] p-4 text-sm leading-7 text-[#59645c] md:p-5">
              “{review.comment}”
            </blockquote>
          ) : (
            <p className="mt-5 text-sm italic text-[#9b9a91]">No written comment provided.</p>
          )}
        </div>

        <aside className="w-full shrink-0 xl:w-72">
          <ReviewContext review={review} />
          <div className="mt-3 flex gap-2">
            <Link href={`/cars/${review.car_id}`} className={`${buttonClass.secondary} flex-1`}>
              View Car
            </Link>
            <button
              type="button"
              onClick={() => onDelete(review)}
              disabled={deleting}
              className={rowActionClass.delete}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </aside>
      </div>
    </article>
  );
}
