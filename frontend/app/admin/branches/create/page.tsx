
    "use client";

    import { useEffect, useState } from "react";
    import type { ChangeEvent, FormEvent } from "react";
    import Link from "next/link";
    import { useRouter } from "next/navigation";

    const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

    type BranchFormData = {
    name: string;
    address: string;
    city: string;
    phone: string;
    };

    export default function CreateBranchPage() {
    const router = useRouter();

    const [formData, setFormData] = useState<BranchFormData>({
        name: "",
        address: "",
        city: "",
        phone: "",
    });

    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [error, setError] = useState("");

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

        setCheckingAuth(false);
        } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        router.replace("/login");
        }
    }, [router]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setFormData((current) => ({
        ...current,
        [name]: value,
        }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const token = localStorage.getItem("token");

        if (!token) {
        router.replace("/login");
        return;
        }

        setLoading(true);
        setError("");

        try {
        const response = await fetch(`${API_URL}/branches`, {
            method: "POST",
            headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
        });

        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.replace("/login");
            return;
        }

        if (!response.ok) {
            if (data.errors) {
            const firstError = Object.values(
                data.errors as Record<string, unknown>
            )
                .flat()
                .find((message): message is string => typeof message === "string");

            throw new Error(firstError || "Failed to create branch.");
            }

            throw new Error(data.message || "Failed to create branch.");
        }

        router.push("/admin/branches");
        } catch (err) {
        setError(
            err instanceof Error ? err.message : "Failed to create branch."
        );
        } finally {
        setLoading(false);
        }
    };

    if (checkingAuth) {
        return (
        <main className="flex min-h-screen items-center justify-center bg-[#f8f8f7] px-5 py-24 text-[#0a1411]">
            <div className="w-full max-w-md rounded-3xl border border-[#e8e5dc] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-[#e8e5dc] border-t-[#c6a15b]" />
            <p className="text-sm font-medium text-[#68736c]">
                Checking access...
            </p>
            </div>
        </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f8f8f7] px-5 py-10 text-[#0a1411] sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
            <Link
            href="/admin/branches"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#68736c] transition hover:text-[#9a783c]"
            >
            <span aria-hidden="true">←</span>
            Back to Branches
            </Link>

            <div className="mb-8 mt-7">
            <div className="mb-3 flex items-center gap-2">
                <span className="h-px w-8 bg-[#c6a15b]" />
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9a783c]">
                Branch Management
                </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-[#0a1411] sm:text-4xl">
                Add New Branch
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#68736c] sm:text-base">
                Add a new rental location to your DriveX network. Enter the branch
                details below to get started.
            </p>
            </div>

            {error && (
            <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
            >
                <span className="font-bold">!</span>
                <p>{error}</p>
            </div>
            )}

            <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-3xl border border-[#e8e5dc] bg-white shadow-[0_12px_40px_rgba(10,20,17,0.04)]"
            >
            <div className="border-b border-[#eeece5] bg-[#0a1411] px-6 py-5 sm:px-8">
                <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#c6a15b]/30 bg-[#c6a15b]/10 text-[#c6a15b]">
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

                <div>
                    <h2 className="font-semibold text-white">Branch Information</h2>
                    <p className="mt-1 text-sm text-white/55">
                    Provide the location's contact details.
                    </p>
                </div>
                </div>
            </div>

            <div className="p-6 sm:p-8">
                <div className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-[#26352d]"
                    >
                    Branch Name <span className="text-[#b58b43]">*</span>
                    </label>

                    <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Cairo Main Branch"
                    autoComplete="organization"
                    required
                    className="w-full rounded-xl border border-[#e3e1d9] bg-[#fcfcfa] px-4 py-3.5 text-sm text-[#0a1411] outline-none transition placeholder:text-[#a3aaa4] focus:border-[#c6a15b] focus:bg-white focus:ring-4 focus:ring-[#c6a15b]/10"
                    />
                </div>

                <div className="sm:col-span-2">
                    <label
                    htmlFor="address"
                    className="mb-2 block text-sm font-semibold text-[#26352d]"
                    >
                    Street Address <span className="text-[#b58b43]">*</span>
                    </label>

                    <input
                    id="address"
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. 123 Main Street"
                    autoComplete="street-address"
                    required
                    className="w-full rounded-xl border border-[#e3e1d9] bg-[#fcfcfa] px-4 py-3.5 text-sm text-[#0a1411] outline-none transition placeholder:text-[#a3aaa4] focus:border-[#c6a15b] focus:bg-white focus:ring-4 focus:ring-[#c6a15b]/10"
                    />
                </div>

                <div>
                    <label
                    htmlFor="city"
                    className="mb-2 block text-sm font-semibold text-[#26352d]"
                    >
                    City <span className="text-[#b58b43]">*</span>
                    </label>

                    <input
                    id="city"
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Cairo"
                    autoComplete="address-level2"
                    required
                    className="w-full rounded-xl border border-[#e3e1d9] bg-[#fcfcfa] px-4 py-3.5 text-sm text-[#0a1411] outline-none transition placeholder:text-[#a3aaa4] focus:border-[#c6a15b] focus:bg-white focus:ring-4 focus:ring-[#c6a15b]/10"
                    />
                </div>

                <div>
                    <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-semibold text-[#26352d]"
                    >
                    Phone Number <span className="text-[#b58b43]">*</span>
                    </label>

                    <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. 01000000000"
                    autoComplete="tel"
                    required
                    className="w-full rounded-xl border border-[#e3e1d9] bg-[#fcfcfa] px-4 py-3.5 text-sm text-[#0a1411] outline-none transition placeholder:text-[#a3aaa4] focus:border-[#c6a15b] focus:bg-white focus:ring-4 focus:ring-[#c6a15b]/10"
                    />
                </div>
                </div>

                <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#eeece5] pt-6 sm:flex-row sm:justify-end">
                <Link
                    href="/admin/branches"
                    className="inline-flex items-center justify-center rounded-xl border border-[#deded5] px-6 py-3 text-sm font-semibold text-[#526057] transition hover:border-[#b9b9ad] hover:bg-[#f8f8f5] hover:text-[#0a1411]"
                >
                    Cancel
                </Link>

                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c6a15b] px-6 py-3 text-sm font-bold text-[#0a1411] shadow-sm transition hover:bg-[#d4b474] focus:outline-none focus:ring-4 focus:ring-[#c6a15b]/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? (
                    <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a1411]/25 border-t-[#0a1411]" />
                        Creating...
                    </>
                    ) : (
                    <>
                        Create Branch
                        <span aria-hidden="true">→</span>
                    </>
                    )}
                </button>
                </div>
            </div>
            </form>

            <p className="mt-5 text-center text-xs text-[#929990]">
            Fields marked with <span className="font-semibold text-[#9a783c]">*</span>{" "}
            are required.
            </p>
        </div>
        </main>
    );
    }
