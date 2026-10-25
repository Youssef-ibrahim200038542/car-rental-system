
    "use client";

    import { useCallback, useEffect, useState } from "react";
    import Link from "next/link";
    import { useParams, useRouter } from "next/navigation";

    type Car = {
    id: number;
    brand: string;
    model: string;
    year: number;
    daily_rate: number;
    status: string;
    category?: {
        id: number;
        name: string;
    } | null;
    branch?: {
        id: number;
        name: string;
    } | null;
    description?: string | null;
    transmission?: string | null;
    fuel_type?: string | null;
    seats?: number | null;
    color?: string | null;
    mileage?: number | null;
    image?: string | null;
    images?: string[] | null;
    plate_number?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    };

    const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

    const statusStyles: Record<string, string> = {
    available: "border-emerald-200 bg-emerald-50 text-emerald-800",
    rented: "border-amber-200 bg-amber-50 text-amber-800",
    reserved: "border-[#e7dcc4] bg-[#f8f0df] text-[#806331]",
    maintenance: "border-orange-200 bg-orange-50 text-orange-800",
    inactive: "border-[#e4e2dc] bg-[#f2f1ed] text-[#73766e]",
    };

    const statusLabels: Record<string, string> = {
    available: "Available",
    rented: "Rented",
    reserved: "Reserved",
    maintenance: "Maintenance",
    inactive: "Inactive",
    };

    function DetailItem({
    label,
    value,
    }: {
    label: string;
    value: string | number | null | undefined;
    }) {
    return (
        <div className="rounded-xl border border-[#e9e5dc] bg-[#fcfbf8] p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-[#85867c]">
            {label}
        </p>
        <p className="mt-2 break-words text-sm font-semibold text-[#0a1411]">
            {value !== null && value !== undefined && value !== ""
            ? value
            : "Not specified"}
        </p>
        </div>
    );
    }

    export default function AdminCarDetailsPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const carId = params.id;

    const [car, setCar] = useState<Car | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchCar = useCallback(async () => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!token || !storedUser) {
        router.replace("/login");
        return;
        }

        try {
        const user = JSON.parse(storedUser);

        if (user.role !== "admin") {
            router.replace("/");
            return;
        }
        } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        router.replace("/login");
        return;
        }

        setLoading(true);
        setError("");

        try {
        const response = await fetch(`${API_URL}/cars/${carId}`, {
            headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
        });

        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.replace("/login");
            return;
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || "Failed to load car details.");
        }

        const carData = data.data ?? data;

        if (!carData || typeof carData !== "object" || !carData.id) {
            throw new Error("Car details could not be found.");
        }

        setCar(carData as Car);
        } catch (err) {
        setError(
            err instanceof Error
            ? err.message
            : "An unexpected error occurred."
        );
        } finally {
        setLoading(false);
        }
    }, [carId, router]);

    useEffect(() => {
        void fetchCar();
    }, [fetchCar]);

    const formatDate = (date?: string | null) => {
        if (!date) return "Not specified";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
        return date;
        }

        return parsedDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        });
    };

    if (loading) {
        return (
        <main className="min-h-screen bg-[#f8f8f7] px-4 pb-16 pt-28 text-[#0a1411] sm:px-6">
            <div className="mx-auto max-w-5xl">
            <div className="rounded-3xl border border-[#e9e5dc] bg-white p-12 text-center shadow-sm">
                <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-[#e9e5dc] border-t-[#c6a15b]" />
                <p className="font-medium text-[#59645c]">
                Loading car details...
                </p>
            </div>
            </div>
        </main>
        );
    }

    if (error || !car) {
        return (
        <main className="min-h-screen bg-[#f8f8f7] px-4 pb-16 pt-28 text-[#0a1411] sm:px-6">
            <div className="mx-auto max-w-5xl">
            <Link
                href="/admin/cars"
                className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#687269] transition hover:text-[#9a783c]"
            >
                <span aria-hidden="true">←</span>
                Back to Cars
            </Link>

            <div
                role="alert"
                className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm sm:p-12"
            >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl font-bold text-red-600">
                !
                </div>

                <h1 className="mt-5 text-xl font-bold text-[#0a1411]">
                Unable to Load Car
                </h1>

                <p className="mt-2 text-sm leading-6 text-[#73786f]">
                {error || "The requested car could not be found."}
                </p>

                <button
                type="button"
                onClick={() => void fetchCar()}
                className="mt-6 rounded-xl bg-[#0a1411] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1a3027]"
                >
                Try Again
                </button>
            </div>
            </div>
        </main>
        );
    }

    const status = car.status?.toLowerCase() || "inactive";

    return (
        <main className="min-h-screen bg-[#f8f8f7] px-4 pb-16 pt-28 text-[#0a1411] sm:px-6">
        <div className="mx-auto max-w-5xl">
            <Link
            href="/admin/cars"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#687269] transition hover:text-[#9a783c]"
            >
            <span aria-hidden="true">←</span>
            Back to Cars
            </Link>

            <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#e7dcc4] bg-[#f3ead7] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#806331]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c6a15b]" />
                Fleet Management
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Car Details
                </h1>

                <p className="mt-2 text-sm text-[#73786f] sm:text-base">
                View vehicle information and manage its fleet record.
                </p>
            </div>

            <Link
                href={`/admin/cars/edit/${car.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0a1411] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1a3027]"
            >
                <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
                aria-hidden="true"
                >
                <path d="m15 5 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15z" />
                </svg>
                Edit Car
            </Link>
            </div>

            <section className="overflow-hidden rounded-3xl border border-[#e9e5dc] bg-white shadow-[0_8px_35px_rgba(10,20,17,0.035)]">
            <div className="border-b border-[#e9e5dc] bg-[#fcfbf8] p-6 sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-[#e9e5dc] bg-[#f3ead7] text-[#96743b]">
                    <svg
                    viewBox="0 0 64 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-14 w-16"
                    aria-hidden="true"
                    >
                    <path d="m10 23 4-10a4 4 0 0 1 3.7-2.5h26.6A4 4 0 0 1 48 13l4 10" />
                    <path d="M7 23h50v8H7z" />
                    <path d="m17 13-3 8h36l-3-8" />
                    <circle cx="17" cy="31" r="4" fill="#f3ead7" />
                    <circle cx="47" cy="31" r="4" fill="#f3ead7" />
                    <path d="M8 26h5m38 0h5" />
                    </svg>
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#85867c]">
                    Vehicle ID #{car.id}
                    </p>

                    <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                    {car.brand} {car.model}
                    </h2>

                    <p className="mt-2 text-sm text-[#73786f]">
                    Model year {car.year}
                    </p>
                </div>

                <div>
                    <span
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold ${
                        statusStyles[status] ||
                        "border-[#e4e2dc] bg-[#f2f1ed] text-[#73766e]"
                    }`}
                    >
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {statusLabels[status] || car.status}
                    </span>
                </div>
                </div>
            </div>

            <div className="p-5 sm:p-8">
                <div className="mb-8">
                <h3 className="mb-4 text-lg font-bold">
                    General Information
                </h3>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailItem label="Brand" value={car.brand} />
                    <DetailItem label="Model" value={car.model} />
                    <DetailItem label="Year" value={car.year} />
                    <DetailItem
                    label="Category"
                    value={car.category?.name}
                    />
                    <DetailItem
                    label="Branch"
                    value={car.branch?.name}
                    />
                    <DetailItem
                    label="Plate Number"
                    value={car.plate_number}
                    />
                </div>
                </div>

                <div className="mb-8">
                <h3 className="mb-4 text-lg font-bold">
                    Rental Information
                </h3>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border border-[#e7dcc4] bg-[#f8f0df] p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-[#806331]">
                        Daily Rate
                    </p>
                    <p className="mt-2 text-xl font-bold text-[#0a1411]">
                        {Number(car.daily_rate).toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                        })}{" "}
                        EGP
                    </p>
                    <p className="mt-1 text-xs text-[#806331]">
                        Per day
                    </p>
                    </div>

                    <DetailItem
                    label="Current Status"
                    value={statusLabels[status] || car.status}
                    />

                    <DetailItem
                    label="Car ID"
                    value={`#${car.id}`}
                    />
                </div>
                </div>

                <div className="mb-8">
                <h3 className="mb-4 text-lg font-bold">
                    Vehicle Specifications
                </h3>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailItem
                    label="Transmission"
                    value={car.transmission}
                    />
                    <DetailItem
                    label="Fuel Type"
                    value={car.fuel_type}
                    />
                    <DetailItem
                    label="Seats"
                    value={car.seats}
                    />
                    <DetailItem
                    label="Color"
                    value={car.color}
                    />
                    <DetailItem
                    label="Mileage"
                    value={
                        car.mileage !== null && car.mileage !== undefined
                        ? `${Number(car.mileage).toLocaleString("en-US")} km`
                        : undefined
                    }
                    />
                </div>
                </div>

                {car.description && (
                <div className="mb-8">
                    <h3 className="mb-4 text-lg font-bold">
                    Description
                    </h3>

                    <div className="rounded-xl border border-[#e9e5dc] bg-[#fcfbf8] p-5">
                    <p className="whitespace-pre-wrap text-sm leading-7 text-[#59645c]">
                        {car.description}
                    </p>
                    </div>
                </div>
                )}

                <div>
                <h3 className="mb-4 text-lg font-bold">
                    Record Information
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                    <DetailItem
                    label="Created At"
                    value={formatDate(car.created_at)}
                    />
                    <DetailItem
                    label="Last Updated"
                    value={formatDate(car.updated_at)}
                    />
                </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#e9e5dc] bg-[#fcfbf8] p-5 sm:flex-row sm:justify-between sm:px-8">
                <Link
                href="/admin/cars"
                className="inline-flex items-center justify-center rounded-xl border border-[#dedbd2] bg-white px-5 py-3 text-sm font-semibold text-[#34443b] transition hover:bg-[#f3f1eb]"
                >
                Back to Inventory
                </Link>

                <Link
                href={`/admin/cars/edit/${car.id}`}
className="inline-flex items-center justify-center rounded-xl bg-[#e8eee7] px-5 py-3 text-sm font-bold text-[#17251e] transition hover:bg-[#d5e1d3]"                >
                Edit This Car
                </Link>
            </div>
            </section>
        </div>
        </main>
    );
    }
