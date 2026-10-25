
    "use client";

    import { useEffect, useState } from "react";
    import type { ChangeEvent, FormEvent } from "react";
    import Link from "next/link";
    import { useParams, useRouter } from "next/navigation";

    type User = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: "admin" | "customer" | "staff";
    };

    type FormData = {
    name: string;
    email: string;
    phone: string;
    role: "admin" | "customer" | "staff";
    };

    const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

    const inputClass =
    "w-full rounded-xl border border-[#e5dfd2] bg-[#fcfbf8] px-4 py-3 text-sm text-[#17251e] outline-none transition placeholder:text-[#a1a49b] focus:border-[#c6a15b] focus:ring-2 focus:ring-[#c6a15b]/15";

    const labelClass = "mb-2 block text-sm font-semibold text-[#34463b]";

    export default function EditUserPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        phone: "",
        role: "customer",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        const fetchUser = async () => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!token || !storedUser) {
            router.replace("/login");
            return;
        }

        try {
            const currentUser = JSON.parse(storedUser);

            if (currentUser.role !== "admin") {
            router.replace("/");
            return;
            }
        } catch {
            localStorage.removeItem("user");
            router.replace("/login");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/users/${id}`, {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            });

            const data = await response.json();

            if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                router.replace("/login");
                return;
            }

            throw new Error(data.message || "Failed to load user.");
            }

            const user: User = data.data;

            if (active) {
            setFormData({
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || "",
                role: user.role || "customer",
            });
            }
        } catch (err) {
            if (active) {
            setError(
                err instanceof Error ? err.message : "Failed to load user."
            );
            }
        } finally {
            if (active) {
            setLoading(false);
            }
        }
        };

        fetchUser();

        return () => {
        active = false;
        };
    }, [router, id]);

    const handleChange = (
        event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = event.target;

        setFormData((current) => ({
        ...current,
        [name]: value,
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const token = localStorage.getItem("token");

        if (!token) {
        router.replace("/login");
        return;
        }

        setSaving(true);
        setError("");

        try {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: "PUT",
            headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
            ...formData,
            phone: formData.phone.trim() || null,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.replace("/login");
            return;
            }

            if (data.errors) {
            const firstError = Object.values(
                data.errors as Record<string, unknown>
            )
                .flatMap((messages) =>
                Array.isArray(messages) ? messages : [messages]
                )
                .find((message) => typeof message === "string");

            throw new Error(
                typeof firstError === "string"
                ? firstError
                : data.message || "Failed to update user."
            );
            }

            throw new Error(data.message || "Failed to update user.");
        }

        router.push("/admin/users");
        router.refresh();
        } catch (err) {
        setError(
            err instanceof Error ? err.message : "Failed to update user."
        );
        } finally {
        setSaving(false);
        }
    };

    if (loading) {
        return (
        <main className="min-h-screen bg-[#f8f8f7] px-5 pb-16 pt-28 text-[#17251e] md:px-8">
            <div className="mx-auto max-w-3xl">
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-[#e8e2d5] bg-white shadow-sm">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e9e1d2] border-t-[#c6a15b]" />
                <p className="mt-5 text-sm font-medium text-[#73796f]">
                Loading user information...
                </p>
            </div>
            </div>
        </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f8f8f7] px-5 pb-16 pt-28 text-[#17251e] md:px-8">
        <div className="mx-auto max-w-3xl">
            <div className="mb-8">
            <Link
                href="/admin/users"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#6d756c] transition hover:text-[#9a783c]"
            >
                <span aria-hidden="true">←</span>
                Back to Users
            </Link>

            <div className="mt-7">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#e5d7b8] bg-[#f5efdf] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#896b35]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c6a15b]" />
                User Management
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-[#14251c] md:text-4xl">
                Edit User
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-[#73796f] md:text-base">
                Update account information and manage the user&apos;s access
                permissions.
                </p>
            </div>
            </div>

            {error && (
            <div
                role="alert"
                className="mb-6 flex items-start justify-between gap-3 rounded-2xl border border-[#e9c8c1] bg-[#fff2ef] px-5 py-4 text-sm text-[#a23b30]"
            >
                <p>{error}</p>
                <button
                type="button"
                onClick={() => setError("")}
                className="shrink-0 font-semibold underline underline-offset-4"
                >
                Dismiss
                </button>
            </div>
            )}

            <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-3xl border border-[#e8e2d5] bg-white shadow-sm"
            >
            <div className="border-b border-[#eee9df] p-5 md:p-7">
                <div className="flex items-center gap-4 rounded-2xl border border-[#e8e2d5] bg-[#fcfbf8] p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#e5d7b8] bg-[#f5efdf] text-xl font-bold text-[#896b35]">
                    {formData.name.charAt(0).toUpperCase() || "U"}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#96998f]">
                    Editing Account
                    </p>
                    <p className="mt-1 truncate font-bold text-[#17251e]">
                    {formData.name || "User"}
                    </p>
                    <p className="mt-1 text-sm text-[#858a81]">User ID #{id}</p>
                </div>

                <div className="hidden rounded-full border border-[#e5d7b8] bg-[#f5efdf] px-3 py-1.5 text-xs font-bold capitalize text-[#896b35] sm:block">
                    {formData.role}
                </div>
                </div>
            </div>

            <div className="space-y-8 p-5 md:p-7">
                <section>
                <div className="mb-5">
                    <h2 className="text-base font-bold text-[#17251e]">
                    Personal Information
                    </h2>
                    <p className="mt-1 text-sm text-[#858a81]">
                    Basic details associated with this account.
                    </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                    <label htmlFor="name" className={labelClass}>
                        Full Name <span className="text-[#b28a3e]">*</span>
                    </label>
                    <input
                        id="name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter full name"
                        autoComplete="name"
                        required
                        maxLength={255}
                        className={inputClass}
                    />
                    </div>

                    <div className="md:col-span-2">
                    <label htmlFor="email" className={labelClass}>
                        Email Address <span className="text-[#b28a3e]">*</span>
                    </label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@example.com"
                        autoComplete="email"
                        required
                        maxLength={255}
                        className={inputClass}
                    />
                    </div>

                    <div className="md:col-span-2">
                    <label htmlFor="phone" className={labelClass}>
                        Phone Number
                    </label>
                    <input
                        id="phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                        autoComplete="tel"
                        maxLength={30}
                        className={inputClass}
                    />
                    <p className="mt-2 text-xs text-[#96998f]">
                        Optional. Leave blank if no phone number is available.
                    </p>
                    </div>
                </div>
                </section>

                <div className="border-t border-[#eee9df]" />

                <section>
                <div className="mb-5">
                    <h2 className="text-base font-bold text-[#17251e]">
                    Account Permissions
                    </h2>
                    <p className="mt-1 text-sm text-[#858a81]">
                    Choose the role that determines this user&apos;s access.
                    </p>
                </div>

                <label htmlFor="role" className={labelClass}>
                    User Role
                </label>
                <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className={inputClass}
                >
                    <option value="customer">Customer</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                </select>

                <div className="mt-4 flex gap-3 rounded-2xl border border-[#e5d7b8] bg-[#fbf7eb] p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f2e7c9] text-lg text-[#896b35]">
                    !
                    </div>
                    <div>
                    <p className="text-sm font-bold text-[#795d2e]">
                        Role Permissions
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#7e7562]">
                        Admins can access the administration dashboard and manage
                        platform data. Staff have operational access according to
                        the backend permissions. Customers use the regular rental
                        experience. Assign elevated roles only to trusted users.
                    </p>
                    </div>
                </div>
                </section>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#eee9df] bg-[#fcfbf8] p-5 sm:flex-row sm:justify-end md:px-7">
                <Link
                href="/admin/users"
                className="inline-flex items-center justify-center rounded-xl border border-[#e5dfd2] bg-white px-6 py-3 text-sm font-semibold text-[#596258] transition hover:border-[#c6a15b] hover:bg-[#faf7f0]"
                >
                Cancel
                </Link>

                <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c6a15b] px-6 py-3 text-sm font-bold text-[#17251e] shadow-sm transition hover:bg-[#b28e49] disabled:cursor-not-allowed disabled:opacity-60"
                >
                {saving ? (
                    <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#17251e]/30 border-t-[#17251e]" />
                    Saving Changes...
                    </>
                ) : (
                    <>
                    Save Changes
                    <span aria-hidden="true">→</span>
                    </>
                )}
                </button>
            </div>
            </form>

            <p className="mt-5 text-center text-xs text-[#96998f]">
            DriveX Admin · User Management
            </p>
        </div>
        </main>
    );
    }
