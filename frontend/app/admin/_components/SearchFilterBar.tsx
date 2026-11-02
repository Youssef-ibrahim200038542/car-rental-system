import { Icon } from "./icons";

export type FilterOption = { value: string; label: string };

export type FilterSelect = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
};

/** Search box plus zero or more select filters, in a list panel's header. */
export function SearchFilterBar({
  search,
  onSearchChange,
  placeholder,
  searchLabel,
  filters = [],
}: {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
  searchLabel: string;
  filters?: FilterSelect[];
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative sm:min-w-[260px]">
        <Icon
          name="search"
          strokeWidth={1.8}
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#85867c]"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={placeholder}
          aria-label={searchLabel}
          className="w-full rounded-xl border border-[#dedbd2] bg-[#fcfbf8] py-3 pl-10 pr-4 text-sm text-[#0a1411] outline-none transition placeholder:text-[#9b9a91] focus:border-[#c6a15b] focus:ring-2 focus:ring-[#c6a15b]/15"
        />
      </div>

      {filters.map((filter) => (
        <select
          key={filter.label}
          value={filter.value}
          onChange={(event) => filter.onChange(event.target.value)}
          aria-label={filter.label}
          className="rounded-xl border border-[#dedbd2] bg-[#fcfbf8] px-4 py-3 text-sm text-[#34443b] outline-none focus:border-[#c6a15b] sm:min-w-[160px]"
        >
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
