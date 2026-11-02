import SectionHeader from "@/app/components/SectionHeader";
import Stars from "@/app/components/Stars";
import { pluralise } from "@/lib/format";
import type { Review } from "@/lib/types";

type CarReviewsProps = {
  reviews: Review[];
  averageRating: number;
};

export default function CarReviews({ reviews, averageRating }: CarReviewsProps) {
  const summary =
    reviews.length > 0 ? (
      <div className="flex items-center gap-3 rounded-xl border border-[#e8e4db] bg-white px-4 py-3">
        <span className="text-2xl text-[#c6a15b]">★</span>
        <div>
          <p className="font-bold text-[#0a1411]">{averageRating.toFixed(1)} / 5</p>
          <p className="text-xs text-[#898981]">
            Based on {reviews.length} {pluralise(reviews.length, "review")}
          </p>
        </div>
      </div>
    ) : null;

  return (
    <section className="mt-14">
      <SectionHeader eyebrow="From our customers" title="Customer Reviews" aside={summary} />

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d9d4c8] bg-white px-6 py-12 text-center">
          <div className="text-4xl text-[#c6a15b]">★</div>
          <h3 className="mt-4 font-semibold text-[#0a1411]">No reviews yet</h3>
          <p className="mt-2 text-sm text-[#898981]">
            Be the first to share your experience after completing a booking.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const author = review.user?.name || "Customer";

  return (
    <article className="rounded-2xl border border-[#e8e4db] bg-white p-6 transition hover:border-[#d4af6a]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f5efdf] font-bold text-[#9a783c]">
            {author.trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-[#0a1411]">{author}</p>
            <p className="mt-1 text-xs text-[#898981]">Verified customer review</p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-bold text-[#0a1411]">{Number(review.rating).toFixed(1)}</p>
          <Stars rating={Number(review.rating)} />
        </div>
      </div>

      {review.comment ? (
        <p className="mt-5 whitespace-pre-line text-sm leading-7 text-[#686860]">
          {review.comment}
        </p>
      ) : (
        <p className="mt-5 text-sm italic text-[#aaa69c]">No written comment.</p>
      )}
    </article>
  );
}
