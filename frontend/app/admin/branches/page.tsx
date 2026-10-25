
    "use client";

    import { useCallback, useEffect, useState } from "react";
    import Link from "next/link";
    import { useRouter } from "next/navigation";

    type Branch = {
    id: number;
    name: string;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
    };

    const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

    export default function AdminBranchesPage() {
    const router = useRouter();

    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [search, setSearch] = useState("");

    const fetchBranches = useCallback(async () => {
        const token = localStorage.getItem("token");

        if (!token) {
        router.replace("/login");
        return;
        }

        try {
        const response = await fetch(`${API_URL}/branches`, {
            headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.replace("/login");
            return;
        }

        if (!response.ok) {
            throw new Error(data.message || "Failed to load branches.");
        }

        setBranches(Array.isArray(data.data) ? data.data : []);
        setError("");
        } catch (err) {
        setError(
            err instanceof Error ? err.message : "Failed to load branches."
        );
        } finally {
        setLoading(false);
        }
    }, [router]);

    useEffect(() => {
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

        fetchBranches();
        } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        router.replace("/login");
        }
    }, [fetchBranches, router]);

    const handleDelete = async (id: number) => {
        const confirmed = window.confirm(
        "Are you sure you want to delete this branch? This action cannot be undone."
        );

        if (!confirmed) return;

        const token = localStorage.getItem("token");

        if (!token) {
        router.replace("/login");
        return;
        }

        setDeletingId(id);
        setError("");

        try {
        const response = await fetch(`${API_URL}/branches/${id}`, {
            method: "DELETE",
            headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.replace("/login");
            return;
        }

        if (!response.ok) {
            throw new Error(
            data.message ||
                "Failed to delete branch. It may be used by cars or bookings."
            );
        }

        setBranches((current) =>
            current.filter((branch) => branch.id !== id)
        );
        } catch (err) {
        setError(
            err instanceof Error ? err.message : "Failed to delete branch."
        );
        } finally {
        setDeletingId(null);
        }
    };

    const filteredBranches = branches.filter((branch) => {
        const query = search.trim().toLowerCase();

        if (!query) return true;

        return [
        branch.name,
        branch.address,
        branch.city,
        branch.phone,
        String(branch.id),
        ].some((value) => value?.toLowerCase().includes(query));
    });

    if (loading) {
        return (
        <main className="flex min-h-screen items-center justify-center bg-[#f8f8f7] px-5 py-20 text-[#0a1411]">
            <div className="w-full max-w-md rounded-3xl border border-[#e8e5dc] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-[#e8e5dc] border-t-[#c6a15b]" />
            <p className="text-sm font-medium text-[#68736c]">
                Loading branches...
            </p>
            </div>
        </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f8f8f7] px-5 py-10 text-[#0a1411] sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
            <div className="mb-9 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
                <Link
                href="/admin"
                className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#68736c] transition hover:text-[#9a783c]"
                >
                <span aria-hidden="true">←</span>
                Back to Dashboard
                </Link>

                <div className="mb-3 flex items-center gap-2">
                <span className="h-px w-8 bg-[#c6a15b]" />
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9a783c]">
                    Location Management
                </span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-[#0a1411] sm:text-4xl">
                Manage Branches
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-[#68736c] sm:text-base">
                Manage your rental locations and keep your branch information
                organized in one place.
                </p>
            </div>

            <Link
                href="/admin/branches/create"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c6a15b] px-5 py-3.5 text-sm font-bold text-[#0a1411] shadow-sm transition hover:bg-[#d4b474] focus:outline-none focus:ring-4 focus:ring-[#c6a15b]/25"
            >
                <span className="text-lg leading-none">+</span>
                Add New Branch
            </Link>
            </div>

            {error && (
            <div
                role="alert"
                className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
            >
                <p>{error}</p>
                <button
                type="button"
                onClick={() => setError("")}
                className="shrink-0 font-semibold hover:text-red-900"
                aria-label="Dismiss error"
                >
                ✕
                </button>
            </div>
            )}

            <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-[#e8e5dc] bg-white p-5 shadow-[0_4px_20px_rgba(10,20,17,0.025)] sm:p-6">
                <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[#68736c]">
                    Total Branches
                </p>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c6a15b]/15 text-[#9a783c]">
                    <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="h-5 w-5"
                    aria-hidden="true"
                    >
                    <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M9 9h.01M15 9h.01M9 12h.01M15 12h.01" />
                    </svg>
                </span>
                </div>
                <p className="mt-4 text-3xl font-bold tracking-tight text-[#0a1411]">
                {branches.length}
                </p>
                <p className="mt-2 text-xs text-[#929990]">
                Registered rental locations
                </p>
            </div>

            <div className="rounded-2xl border border-[#e8e5dc] bg-white p-5 shadow-[0_4px_20px_rgba(10,20,17,0.025)] sm:p-6">
                <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[#68736c]">
                    Cities Covered
                </p>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a1411]/5 text-[#1a3027]">
                    <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="h-5 w-5"
                    aria-hidden="true"
                    >
                    <path d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z" />
                    <circle cx="12" cy="9" r="2.5" />
                    </svg>
                </span>
                </div>
                <p className="mt-4 text-3xl font-bold tracking-tight text-[#0a1411]">
                {
                    new Set(
                    branches
                        .map((branch) => branch.city?.trim().toLowerCase())
                        .filter(Boolean)
                    ).size
                }
                </p>
                <p className="mt-2 text-xs text-[#929990]">
                Unique cities with branches
                </p>
            </div>

            <div className="rounded-2xl border border-[#e8e5dc] bg-white p-5 shadow-[0_4px_20px_rgba(10,20,17,0.025)] sm:col-span-2 sm:p-6 xl:col-span-1">
                <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[#68736c]">
                    Branch Management
                </p>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a3027]/10 text-[#1a3027]">
                    <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="h-5 w-5"
                    aria-hidden="true"
                    >
                    <path d="m5 12 4 4L19 6" />
                    <circle cx="12" cy="12" r="10" />
                    </svg>
                </span>
                </div>
                <p className="mt-4 text-2xl font-bold text-[#1a3027]">
                {branches.length > 0 ? "Up to date" : "Ready to set up"}
                </p>
                <p className="mt-2 text-xs text-[#929990]">
                {branches.length > 0
                    ? "Your branch records are available"
                    : "Add your first rental location"}
                </p>
            </div>
            </div>

            <section className="overflow-hidden rounded-3xl border border-[#e8e5dc] bg-white shadow-[0_8px_30px_rgba(10,20,17,0.03)]">
            <div className="flex flex-col gap-4 border-b border-[#eeece5] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div>
                <h2 className="text-lg font-bold text-[#0a1411]">
                    All Branches
                </h2>
                <p className="mt-1 text-sm text-[#929990]">
                    {filteredBranches.length}{" "}
                    {filteredBranches.length === 1 ? "branch" : "branches"} shown
                </p>
                </div>

                <div className="relative w-full sm:max-w-xs">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#929990]"
                    aria-hidden="true"
                >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m16 16 4 4" />
                </svg>
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search branches..."
                    aria-label="Search branches"
                    className="w-full rounded-xl border border-[#e3e1d9] bg-[#fcfcfa] py-3 pl-10 pr-4 text-sm text-[#0a1411] outline-none transition placeholder:text-[#a3aaa4] focus:border-[#c6a15b] focus:bg-white focus:ring-4 focus:ring-[#c6a15b]/10"
                />
                </div>
            </div>

            {filteredBranches.length === 0 ? (
                <div className="px-6 py-16 text-center sm:px-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c6a15b]/10 text-[#9a783c]">
                    <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="h-8 w-8"
                    aria-hidden="true"
                    >
                    <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5" />
                    </svg>
                </div>

                <h3 className="mt-5 text-lg font-bold text-[#0a1411]">
                    {search ? "No matching branches" : "No branches yet"}
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#68736c]">
                    {search
                    ? "Try another search term or check the branch name, city, or phone number."
                    : "Get started by adding your first rental branch to DriveX."}
                </p>

                {search ? (
                    <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mt-5 rounded-xl border border-[#deded5] px-5 py-2.5 text-sm font-semibold text-[#526057] transition hover:bg-[#f8f8f5]"
                    >
                    Clear Search
                    </button>
                ) : (
                    <Link
                    href="/admin/branches/create"
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#c6a15b] px-5 py-3 text-sm font-bold text-[#0a1411] transition hover:bg-[#d4b474]"
                    >
                    + Add Your First Branch
                    </Link>
                )}
                </div>
            ) : (
                <div className="grid gap-0 sm:grid-cols-2 xl:grid-cols-3">
                {filteredBranches.map((branch, index) => (
                    <article
                    key={branch.id}
                    className={`group p-5 transition hover:bg-[#fcfbf7] sm:p-6 ${
                        index % 3 !== 0 ? "xl:border-l xl:border-[#eeece5]" : ""
                    } border-b border-[#eeece5]`}
                    >
                    <div className="mb-5 flex items-start justify-between gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c6a15b]/20 bg-[#c6a15b]/10 text-[#9a783c]">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            className="h-6 w-6"
                            aria-hidden="true"
                        >
                            <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M9 9h.01M15 9h.01M9 12h.01M15 12h.01" />
                        </svg>
                        </div>

                        <span className="rounded-full border border-[#1a3027]/15 bg-[#1a3027]/5 px-3 py-1 text-xs font-semibold text-[#1a3027]">
                        Branch #{branch.id}
                        </span>
                    </div>

                    <h3 className="break-words text-lg font-bold text-[#0a1411] transition group-hover:text-[#9a783c]">
                        {branch.name}
                    </h3>

                    <div className="mt-4 space-y-3">
                        <div className="flex items-start gap-3">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            className="mt-0.5 h-4 w-4 shrink-0 text-[#9a783c]"
                            aria-hidden="true"
                        >
                            <path d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z" />
                            <circle cx="12" cy="9" r="2.5" />
                        </svg>
                        <p className="break-words text-sm leading-6 text-[#68736c]">
                            {branch.address || "No address provided"}
                            {branch.city ? `, ${branch.city}` : ""}
                        </p>
                        </div>

                        <div className="flex items-center gap-3">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            className="h-4 w-4 shrink-0 text-[#9a783c]"
                            aria-hidden="true"
                        >
                            <path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 11.2 19a19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.2 4.2 2 2 0 0 1 4.2 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2.1Z" />
                        </svg>
                        <p className="break-all text-sm text-[#68736c]">
                            {branch.phone || "No phone provided"}
                        </p>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-2 border-t border-[#eeece5] pt-5">
                        <Link
                        href={`/admin/branches/${branch.id}/edit`}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#c6a15b]/35 bg-[#c6a15b]/10 px-3 py-2.5 text-sm font-semibold text-[#80612c] transition hover:border-[#c6a15b] hover:bg-[#c6a15b] hover:text-[#0a1411]"
                        >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-4 w-4"
                            aria-hidden="true"
                        >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
                        </svg>
                        Edit Branch
                        </Link>

                        <button
                        type="button"
                        onClick={() => handleDelete(branch.id)}
                        disabled={deletingId === branch.id}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                        {deletingId === branch.id ? (
                            <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-700" />
                            Deleting
                            </>
                        ) : (
                            <>
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                className="h-4 w-4"
                                aria-hidden="true"
                            >
                                <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" />
                            </svg>
                            Delete
                            </>
                        )}
                        </button>
                    </div>
                    </article>
                ))}
                </div>
            )}
            </section>

            <p className="mt-5 text-center text-xs text-[#929990]">
            DriveX Branch Management · Keep your rental locations organized.
            </p>
        </div>
        </main>
    );
    }
