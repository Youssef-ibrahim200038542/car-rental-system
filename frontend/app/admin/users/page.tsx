
    "use client";

    import { useCallback, useEffect, useState } from "react";
    import Link from "next/link";
    import { useRouter } from "next/navigation";

    type User = {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    role: "admin" | "customer" | "staff";
    created_at: string;
    bookings_count?: number;
    };

    const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

    const cardClass =
    "rounded-2xl border border-[#e8e2d5] bg-white p-5 shadow-sm";

    const secondaryButtonClass =
    "inline-flex items-center justify-center rounded-xl border border-[#e5dfd2] bg-white px-4 py-2.5 text-sm font-semibold text-[#34463b] transition hover:border-[#c6a15b] hover:bg-[#faf7f0]";

    export default function AdminUsersPage() {
    const router = useRouter();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    const fetchUsers = useCallback(async () => {
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

        setLoading(true);
        setError("");

        try {
        const response = await fetch(`${API_URL}/users`, {
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

            throw new Error(data.message || "Failed to load users.");
        }

        setUsers(Array.isArray(data.data) ? data.data : []);
        } catch (err) {
        setError(
            err instanceof Error ? err.message : "Failed to load users."
        );
        } finally {
        setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleDelete = async (user: User) => {
        if (deletingId !== null) return;

        if (user.role === "admin") {
        const adminCount = users.filter(
            (item) => item.role === "admin"
        ).length;

        if (adminCount <= 1) {
            setError("The only administrator cannot be deleted.");
            return;
        }
        }

        const confirmed = window.confirm(
        `Are you sure you want to delete ${user.name}? This action cannot be undone.`
        );

        if (!confirmed) return;

        const token = localStorage.getItem("token");

        if (!token) {
        router.replace("/login");
        return;
        }

        setDeletingId(user.id);
        setError("");

        try {
        const response = await fetch(`${API_URL}/users/${user.id}`, {
            method: "DELETE",
            headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            },
        });

        const data =
            response.status === 204 ? {} : await response.json();

        if (!response.ok) {
            if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.replace("/login");
            return;
            }

            throw new Error(data.message || "Failed to delete user.");
        }

        setUsers((current) =>
            current.filter((item) => item.id !== user.id)
        );
        } catch (err) {
        setError(
            err instanceof Error ? err.message : "Failed to delete user."
        );
        } finally {
        setDeletingId(null);
        }
    };

    const getRoleStyle = (role: string) => {
        switch (role) {
        case "admin":
            return "border-[#e5d7b8] bg-[#f5efdf] text-[#896b35]";
        case "staff":
            return "border-[#d6e2d6] bg-[#edf1e9] text-[#405e48]";
        case "customer":
            return "border-[#d9e8dc] bg-[#eaf4ec] text-[#28633b]";
        default:
            return "border-[#e8e2d5] bg-[#f1f0eb] text-[#62665e]";
        }
    };

    const formatDate = (date: string) => {
        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) return "—";

        return parsedDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        });
    };

    const adminCount = users.filter(
        (user) => user.role === "admin"
    ).length;

    const customerCount = users.filter(
        (user) => user.role === "customer"
    ).length;

    const staffCount = users.filter(
        (user) => user.role === "staff"
    ).length;

    const filteredUsers = users.filter((user) => {
        const query = search.trim().toLowerCase();

        const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        String(user.id).includes(query) ||
        (user.phone || "").toLowerCase().includes(query);

        const matchesRole =
        roleFilter === "all" || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    if (loading) {
        return (
        <main className="min-h-screen bg-[#f8f8f7] px-5 pb-16 pt-28 text-[#17251e] md:px-8">
            <div className="mx-auto max-w-7xl">
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-[#e8e2d5] bg-white shadow-sm">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e9e1d2] border-t-[#c6a15b]" />
                <p className="mt-5 text-sm font-medium text-[#73796f]">
                Loading users...
                </p>
            </div>
            </div>
        </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f8f8f7] px-5 pb-16 pt-28 text-[#17251e] md:px-8">
        <div className="mx-auto max-w-7xl">
            <div className="mb-8">
            <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#6d756c] transition hover:text-[#9a783c]"
            >
                <span aria-hidden="true">←</span>
                Back to Dashboard
            </Link>

            <div className="mt-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#e5d7b8] bg-[#f5efdf] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#896b35]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#c6a15b]" />
                    User Management
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-[#14251c] md:text-4xl">
                    Manage Users
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#73796f] md:text-base">
                    Manage customer accounts, staff members, and administrators
                    from one place.
                </p>
                </div>

                <button
                type="button"
                onClick={fetchUsers}
                className={secondaryButtonClass}
                >
                <span aria-hidden="true">↻</span>
                Refresh Users
                </button>
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

            <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className={cardClass}>
                <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-[#73796f]">
                    Total Users
                    </p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-[#17251e]">
                    {users.length}
                    </p>
                    <p className="mt-2 text-xs text-[#858a81]">
                    Registered accounts
                    </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf1e9] text-xl text-[#405e48]">
                    <span aria-hidden="true">♙</span>
                </div>
                </div>
            </div>

            <div className={cardClass}>
                <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-[#73796f]">
                    Customers
                    </p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-[#28633b]">
                    {customerCount}
                    </p>
                    <p className="mt-2 text-xs text-[#858a81]">
                    Rental customers
                    </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e6f2e8] text-xl text-[#28633b]">
                    ♙
                </div>
                </div>
            </div>

            <div className={cardClass}>
                <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-[#73796f]">Staff</p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-[#405e48]">
                    {staffCount}
                    </p>
                    <p className="mt-2 text-xs text-[#858a81]">
                    Operational team
                    </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf1e9] text-xl text-[#405e48]">
                    ◈
                </div>
                </div>
            </div>

            <div className={cardClass}>
                <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-[#73796f]">
                    Administrators
                    </p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-[#9a783c]">
                    {adminCount}
                    </p>
                    <p className="mt-2 text-xs text-[#858a81]">
                    Users with admin role
                    </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5efdf] text-xl text-[#896b35]">
                    ⚙
                </div>
                </div>
            </div>
            </div>

            <section className="overflow-hidden rounded-3xl border border-[#e8e2d5] bg-white shadow-sm">
            <div className="border-b border-[#eee9df] p-5 md:p-6">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                    <h2 className="text-lg font-bold text-[#17251e]">
                    All Users
                    </h2>
                    <p className="mt-1 text-sm text-[#7b8178]">
                    Showing {filteredUsers.length} of {users.length} accounts
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative min-w-0 sm:w-72">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9086]">
                        ⌕
                    </span>
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search name, email, phone..."
                        aria-label="Search users"
                        className="w-full rounded-xl border border-[#e5dfd2] bg-[#fcfbf8] py-3 pl-10 pr-4 text-sm text-[#17251e] outline-none transition placeholder:text-[#9a9e95] focus:border-[#c6a15b] focus:ring-2 focus:ring-[#c6a15b]/15"
                    />
                    </div>

                    <select
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value)}
                    aria-label="Filter users by role"
                    className="rounded-xl border border-[#e5dfd2] bg-[#fcfbf8] px-4 py-3 text-sm text-[#34463b] outline-none transition focus:border-[#c6a15b] focus:ring-2 focus:ring-[#c6a15b]/15"
                    >
                    <option value="all">All roles</option>
                    <option value="customer">Customers</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Administrators</option>
                    </select>
                </div>
                </div>
            </div>

            {users.length === 0 ? (
                <div className="px-6 py-20 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf1e9] text-3xl text-[#405e48]">
                    ♙
                </div>
                <h3 className="mt-5 text-xl font-bold text-[#17251e]">
                    No Users Found
                </h3>
                <p className="mt-2 text-sm text-[#7b8178]">
                    Registered users will appear here.
                </p>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="px-6 py-16 text-center">
                <h3 className="text-lg font-bold text-[#17251e]">
                    No matching users
                </h3>
                <p className="mt-2 text-sm text-[#7b8178]">
                    Try a different search term or role.
                </p>
                <button
                    type="button"
                    onClick={() => {
                    setSearch("");
                    setRoleFilter("all");
                    }}
                    className="mt-4 text-sm font-semibold text-[#9a783c] underline underline-offset-4"
                >
                    Clear filters
                </button>
                </div>
            ) : (
                <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left">
                    <thead className="border-b border-[#eee9df] bg-[#fcfbf8]">
                    <tr>
                        {[
                        "User",
                        "Phone",
                        "Role",
                        "Bookings",
                        "Joined",
                        "Actions",
                        ].map((heading) => (
                        <th
                            key={heading}
                            className={`px-5 py-4 text-xs font-bold uppercase tracking-[0.1em] text-[#858a81] md:px-6 ${
                            heading === "Actions" ? "text-right" : ""
                            }`}
                        >
                            {heading}
                        </th>
                        ))}
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-[#eee9df]">
                    {filteredUsers.map((user) => (
                        <tr
                        key={user.id}
                        className="transition hover:bg-[#fcfbf8]"
                        >
                        <td className="px-5 py-5 md:px-6">
                            <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e5d7b8] bg-[#f5efdf] font-bold text-[#896b35]">
                                {user.name?.charAt(0).toUpperCase() || "U"}
                            </div>

                            <div className="min-w-0">
                                <p className="font-bold text-[#17251e]">
                                {user.name}
                                </p>
                                <p className="mt-1 text-sm text-[#73796f]">
                                {user.email}
                                </p>
                                <p className="mt-1 text-xs text-[#96998f]">
                                ID #{user.id}
                                </p>
                            </div>
                            </div>
                        </td>

                        <td className="px-5 py-5 text-sm text-[#596258] md:px-6">
                            {user.phone || "—"}
                        </td>

                        <td className="px-5 py-5 md:px-6">
                            <span
                            className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${getRoleStyle(user.role)}`}
                            >
                            {user.role}
                            </span>
                        </td>

                        <td className="px-5 py-5 md:px-6">
                            <span className="inline-flex min-w-9 items-center justify-center rounded-lg bg-[#edf1e9] px-2.5 py-1.5 text-sm font-bold text-[#34463b]">
                            {user.bookings_count ?? 0}
                            </span>
                        </td>

                        <td className="px-5 py-5 text-sm text-[#73796f] md:px-6">
                            {formatDate(user.created_at)}
                        </td>

                        <td className="px-5 py-5 md:px-6">
                            <div className="flex items-center justify-end gap-2">
                            <Link
                                href={`/admin/users/edit/${user.id}`}
                                className="inline-flex items-center justify-center rounded-lg border border-[#e5d7b8] bg-[#f5efdf] px-3 py-2 text-xs font-bold text-[#896b35] transition hover:bg-[#eee2c5]"
                            >
                                Edit
                            </Link>

                            <button
                                type="button"
                                onClick={() => handleDelete(user)}
                                disabled={deletingId !== null}
                                className="inline-flex items-center justify-center rounded-lg border border-[#e8c9c2] bg-[#fff5f2] px-3 py-2 text-xs font-bold text-[#a23b30] transition hover:bg-[#fbe9e6] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {deletingId === user.id ? "Deleting..." : "Delete"}
                            </button>
                            </div>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            )}
            </section>

            <p className="mt-5 text-center text-xs text-[#96998f]">
            DriveX Admin · User Management
            </p>
        </div>
        </main>
    );
    }
