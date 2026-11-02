const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

type StarRatingInputProps = {
  value: number;
  onChange: (rating: number) => void;
};

/** Five toggle buttons for a 1–5 rating, with the word for the chosen value. */
export default function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  return (
    <>
      <div
        className="mt-8 flex justify-center gap-1.5 sm:gap-3"
        role="group"
        aria-label="Rate your rental experience"
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`${star} out of 5 stars`}
            aria-pressed={value === star}
            className={`rounded-xl p-1 text-4xl transition duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#c6a15b] sm:text-5xl ${
              star <= value ? "text-[#c6a15b]" : "text-[#d9dbd4] hover:text-[#c6a15b]/70"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <div className="mt-3 min-h-6 text-center">
        <p className={`text-sm font-semibold ${value ? "text-[#9a783c]" : "text-[#929a94]"}`}>
          {RATING_LABELS[value] || "Select your rating"}
        </p>
      </div>
    </>
  );
}
