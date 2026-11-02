/** Warns that a car cannot be saved until a category and a branch exist. */
export function MissingOptionsNotice({ categories, branches }: { categories: number; branches: number }) {
  if (categories > 0 && branches > 0) return null;

  const message =
    categories === 0 && branches === 0
      ? "There are no categories or branches available. Add at least one category and one branch before saving a car."
      : categories === 0
        ? "There are no car categories available. Create a category before saving a vehicle."
        : "There are no branches available. Create a branch before saving a vehicle.";

  return (
    <div
      role="status"
      className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800"
    >
      {message}
    </div>
  );
}
