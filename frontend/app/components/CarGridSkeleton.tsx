/** Placeholder cards shaped like CarCard while a car list loads. */
export default function CarGridSkeleton({
  count = 6,
  className = "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className} role="status" aria-label="Loading cars">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-[#e8e6e1] bg-white">
          <div className="aspect-[16/10] animate-pulse bg-[#eae8e2]" />
          <div className="space-y-4 p-5">
            <div className="h-3 w-1/3 animate-pulse rounded bg-[#eae8e2]" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-[#eae8e2]" />
            <div className="h-4 w-full animate-pulse rounded bg-[#eae8e2]" />
            <div className="h-11 w-full animate-pulse rounded-xl bg-[#eae8e2]" />
          </div>
        </div>
      ))}
    </div>
  );
}
