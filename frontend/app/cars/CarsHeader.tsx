import Icon from "@/app/components/icons";

type CarsHeaderProps = {
  loading: boolean;
  total: number;
  available: number;
  categories: number;
  fuels: number;
};

/** Title and fleet counters at the top of the catalogue. */
export default function CarsHeader({ loading, total, available, categories, fuels }: CarsHeaderProps) {
  const show = (value: number) => (loading ? "—" : value);

  return (
    <section className="px-5 pb-8 pt-32 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 border-b border-[#e8e6e1] pb-8 md:flex-row md:items-end">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="h-[2px] w-8 bg-[#c6a15b]" />
              <span className="text-xs font-bold uppercase tracking-[0.24em] text-[#9a783c]">
                The DriveX Collection
              </span>
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-[#0a1411] sm:text-5xl lg:text-6xl">
              Find your <span className="text-[#b08b48]">drive.</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[#777777] sm:text-base">
              Explore our collection and find the right car for your next journey, whether
              it&apos;s a city drive or a weekend escape.
            </p>
          </div>

          <div className="flex items-center gap-4 self-start rounded-2xl border border-[#e8e6e1] bg-white px-5 py-4 md:self-auto">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5efdf] text-[#a7833e]">
              <Icon name="car" className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-[#0a1411]">{show(total)}</p>
              <p className="mt-1 text-xs text-[#777777]">Cars in our collection</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-xl bg-[#0a1411] px-5 py-4 text-white">
            <span className="text-sm text-white/70">Available cars</span>
            <span className="text-xl font-semibold text-[#d4af6a]">{show(available)}</span>
          </div>
          <Counter label="Categories" value={show(categories)} />
          <Counter label="Fuel options" value={show(fuels)} />
        </div>
      </div>
    </section>
  );
}

function Counter({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#e8e6e1] bg-white px-5 py-4">
      <span className="text-sm text-[#777777]">{label}</span>
      <span className="text-xl font-semibold text-[#0a1411]">{value}</span>
    </div>
  );
}
