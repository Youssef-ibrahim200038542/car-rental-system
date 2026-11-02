import Icon from "@/app/components/icons";

type CarFiltersProps = {
  search: string;
  category: string;
  fuel: string;
  categories: string[];
  fuels: string[];
  /** Values carried over from the home-page search, shown as chips. */
  homeSearch: { pickup: string; from: string; to: string; seats: string };
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onFuelChange: (value: string) => void;
  onClear: () => void;
};

const selectClass =
  "h-12 w-full rounded-xl border border-[#e8e6e1] bg-[#fafaf9] px-4 text-sm text-[#333333] outline-none transition focus:border-[#c6a15b] focus:bg-white";

/** Search box, category and fuel selects, and home-search chips. */
export default function CarFilters({
  search,
  category,
  fuel,
  categories,
  fuels,
  homeSearch,
  onSearchChange,
  onCategoryChange,
  onFuelChange,
  onClear,
}: CarFiltersProps) {
  const { pickup, from, to, seats } = homeSearch;
  const chips = [
    pickup && `Pickup: ${pickup}`,
    from && `From: ${from}`,
    to && `To: ${to}`,
    seats !== "any" && (seats === "7" ? "7+ seats" : `${seats} seats`),
  ].filter((chip): chip is string => Boolean(chip));

  return (
    <div className="rounded-2xl border border-[#e8e6e1] bg-white p-4 shadow-[0_4px_20px_rgba(10,20,17,0.03)] sm:p-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.6fr_1fr_1fr_auto]">
        <div className="relative">
          <Icon
            name="search"
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#999999]"
            strokeWidth={1.7}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by car, brand..."
            aria-label="Search cars"
            className="h-12 w-full rounded-xl border border-[#e8e6e1] bg-[#fafaf9] pl-12 pr-4 text-sm text-[#202020] outline-none transition focus:border-[#c6a15b] focus:bg-white"
          />
        </div>

        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className={selectClass}
          aria-label="Filter by category"
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item === "All" ? "All Categories" : item}
            </option>
          ))}
        </select>

        <select
          value={fuel}
          onChange={(e) => onFuelChange(e.target.value)}
          className={selectClass}
          aria-label="Filter by fuel type"
        >
          {fuels.map((item) => (
            <option key={item} value={item}>
              {item === "All" ? "All Fuel Types" : item}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onClear}
          className="h-12 rounded-xl border border-[#e8e6e1] px-5 text-sm font-medium text-[#555555] transition hover:border-[#c6a15b] hover:bg-[#f5efdf] hover:text-[#0a1411]"
        >
          Clear filters
        </button>
      </div>

      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#efeee9] pt-4 text-xs text-[#777777]">
          <span className="font-semibold text-[#0a1411]">Home search:</span>
          {chips.map((chip) => (
            <span key={chip} className="rounded-full bg-[#f5efdf] px-3 py-1.5">
              {chip}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
