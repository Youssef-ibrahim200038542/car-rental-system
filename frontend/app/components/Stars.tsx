/** Read-only five-star rating, rounded to the nearest whole star. */
export default function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-1 text-[#c6a15b]"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < Math.round(rating) ? "opacity-100" : "opacity-25"}>
          ★
        </span>
      ))}
    </div>
  );
}
