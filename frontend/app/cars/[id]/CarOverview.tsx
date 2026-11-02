import CarImage from "@/app/components/CarImage";
import Stars from "@/app/components/Stars";
import { carDisplayName, carImages } from "@/lib/cars";
import { formatPrice, pluralise } from "@/lib/format";
import type { Car } from "@/lib/types";

type CarOverviewProps = {
  car: Car;
  bookable: boolean;
  averageRating: number;
  reviewCount: number;
  onBook: () => void;
};

/** Photo, rating, daily rate and the main "Book" button. */
export default function CarOverview({
  car,
  bookable,
  averageRating,
  reviewCount,
  onBook,
}: CarOverviewProps) {
  const name = carDisplayName(car);
  const { src, fallbackSrc } = carImages(car);

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
      <div className="overflow-hidden rounded-3xl border border-[#e8e4db] bg-white shadow-[0_8px_30px_rgba(10,20,17,0.04)]">
        <div className="relative aspect-[4/3] min-h-[280px] overflow-hidden bg-[#eeece6] sm:min-h-[400px]">
          <CarImage
            src={src}
            fallbackSrc={fallbackSrc}
            alt={name}
            sizes="(min-width: 1024px) 58vw, 100vw"
            preload
            className="object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

          <span
            className={`absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold backdrop-blur-md ${
              bookable
                ? "border-[#b9dfc3]/60 bg-[#e5f3e9]/95 text-[#216b42]"
                : "border-white/40 bg-black/50 text-white"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${bookable ? "bg-[#2c8b52]" : "bg-[#e57373]"}`} />
            {bookable ? "Available" : "Unavailable"}
          </span>

          {car.category?.name && (
            <span className="absolute right-5 top-5 rounded-full border border-white/30 bg-black/40 px-4 py-2 text-xs font-medium text-white backdrop-blur-md">
              {car.category.name}
            </span>
          )}

          <div className="absolute bottom-5 left-5 right-5 text-white">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/75">
              DriveX Collection
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{name}</h1>
            <p className="mt-1 text-sm text-white/80">{car.year}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-[2px] w-8 bg-[#c6a15b]" />
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#9a783c]">
            Your next journey
          </span>
        </div>

        <h2 className="text-3xl font-bold tracking-tight text-[#0a1411] sm:text-4xl">{name}</h2>

        <p className="mt-3 text-sm leading-7 text-[#77776f]">
          Discover the details, explore the features, and get ready for your next drive with
          DriveX.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Stars rating={averageRating} />
          <span className="font-semibold text-[#0a1411]">
            {averageRating > 0 ? averageRating.toFixed(1) : "No ratings"}
          </span>
          <span className="text-[#c5c1b8]">•</span>
          <span className="text-sm text-[#77776f]">
            {reviewCount} {pluralise(reviewCount, "review")}
          </span>
        </div>

        <div className="mt-7 rounded-2xl border border-[#e8e4db] bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#898981]">
            Daily rental rate
          </p>
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight text-[#0a1411]">
              {formatPrice(car.daily_rate)}
            </span>
            <span className="text-sm font-medium text-[#898981]">EGP / day</span>
          </div>

          <div className="mt-5 border-t border-[#efeee9] pt-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-[#77776f]">Pickup branch</span>
              <span className="text-right font-semibold text-[#0a1411]">
                {car.branch?.name || "See booking options"}
              </span>
            </div>
            {car.branch?.address && (
              <p className="mt-2 text-right text-xs text-[#898981]">
                {[car.branch.address, car.branch.city].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onBook}
          disabled={!bookable}
          className={`mt-5 flex h-14 w-full items-center justify-center gap-3 rounded-xl px-6 font-semibold transition ${
            bookable
              ? "bg-[#0a1411] text-white hover:bg-[#1a3027]"
              : "cursor-not-allowed bg-[#e5e3dd] text-[#99968e]"
          }`}
        >
          {bookable ? "Book This Car" : "Currently Unavailable"}
          {bookable && <span aria-hidden="true">→</span>}
        </button>

        <p className="mt-3 text-center text-xs leading-5 text-[#898981]">
          Review your booking details before confirming your reservation.
        </p>
      </div>
    </div>
  );
}
