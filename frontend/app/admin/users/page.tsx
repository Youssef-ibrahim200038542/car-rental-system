    "use client";

    import { useEffect, useState } from "react";
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

    export default function AdminUsersPage() {
    const router = useRouter();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [error, setError] = useState("");

    const fetchUsers = async () => {
    const token = localStorage.getItem("token");


    if (!token) {
    router.push("/login");
    return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    try {
    const response = await fetch(apiUrl + "/users", {
        headers: {
        Accept: "application/json",
        Authorization: "Bearer " + token,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
        data.message || "Failed to load users."
        );
    }

    setUsers(data.data || []);
    } catch (err) {
    setError(
        err instanceof Error
        ? err.message
        : "Failed to load users."
    );
    } finally {
    setLoading(false);
    }


    };

    useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");


    if (!token || !storedUser) {
    router.push("/login");
    return;
    }

    try {
    const user = JSON.parse(storedUser);

    if (user.role !== "admin") {
        router.push("/");
        return;
    }

    fetchUsers();
    } catch {
    localStorage.removeItem("user");
    router.push("/login");
    }


    }, [router]);

    const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
    "Are you sure you want to delete this user?"
    );


    if (!confirmed) {
    return;
    }

    const token = localStorage.getItem("token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    setDeletingId(id);
    setError("");

    try {
    const response = await fetch(
        apiUrl + "/users/" + id,
        {
        method: "DELETE",
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + token,
        },
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
        data.message || "Failed to delete user."
        );
    }

    setUsers((currentUsers) =>
        currentUsers.filter((user) => user.id !== id)
    );
    } catch (err) {
    setError(
        err instanceof Error
        ? err.message
        : "Failed to delete user."
    );
    } finally {
    setDeletingId(null);
    }


    };

    const getRoleStyle = (role: string) => {
    switch (role) {
    case "admin":
    return "bg-purple-500/10 text-purple-400 border-purple-500/20";


    case "staff":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";

    case "customer":
        return "bg-green-500/10 text-green-400 border-green-500/20";

    default:
        return "bg-white/5 text-gray-400 border-white/10";
    }


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

    if (loading) {
    return ( <main className="min-h-screen bg-[#050816] px-6 pb-20 pt-32 text-white"> <div className="mx-auto max-w-7xl"> <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center"> <p className="text-gray-400">
    Loading users... </p> </div> </div> </main>
    );
    }

    return ( <main className="min-h-screen bg-[#050816] px-6 pb-20 pt-32 text-white"> <div className="mx-auto max-w-7xl"> <div className="mb-10"> <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
        >
    ← Back to Dashboard </Link>


        <h1 className="mt-6 text-4xl font-bold tracking-tight">
            Manage Users
        </h1>

        <p className="mt-2 text-gray-400">
            Manage customers, staff members and administrators.
        </p>
        </div>

        {error && (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
            {error}
        </div>
        )}

        <div className="mb-8 grid gap-5 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-gray-400">
            Total Users
            </p>

            <p className="mt-2 text-3xl font-bold">
            {users.length}
            </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-gray-400">
            Customers
            </p>

            <p className="mt-2 text-3xl font-bold text-green-400">
            {customerCount}
            </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-gray-400">
            Staff
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-400">
            {staffCount}
            </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-gray-400">
            Administrators
            </p>

            <p className="mt-2 text-3xl font-bold text-purple-400">
            {adminCount}
            </p>
        </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
            <thead className="border-b border-white/10 bg-white/[0.02]">
                <tr>
                <th className="px-6 py-5 text-sm font-semibold text-gray-300">
                    User
                </th>

                <th className="px-6 py-5 text-sm font-semibold text-gray-300">
                    Phone
                </th>

                <th className="px-6 py-5 text-sm font-semibold text-gray-300">
                    Role
                </th>

                <th className="px-6 py-5 text-sm font-semibold text-gray-300">
                    Bookings
                </th>

                <th className="px-6 py-5 text-sm font-semibold text-gray-300">
                    Joined
                </th>

                <th className="px-6 py-5 text-right text-sm font-semibold text-gray-300">
                    Actions
                </th>
                </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
                {users.map((user) => (
                <tr
                    key={user.id}
                    className="transition hover:bg-white/[0.02]"
                >
                    <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/10 font-bold text-blue-400">
                        {user.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                        <p className="font-semibold text-white">
                            {user.name}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            {user.email}
                        </p>

                        <p className="mt-1 text-xs text-gray-600">
                            ID #{user.id}
                        </p>
                        </div>
                    </div>
                    </td>

                    <td className="px-6 py-5 text-sm text-gray-300">
                    {user.phone || "—"}
                    </td>

                    <td className="px-6 py-5">
                    <span
                        className={
                        "rounded-full border px-3 py-1.5 text-xs font-medium capitalize " +
                        getRoleStyle(user.role)
                        }
                    >
                        {user.role}
                    </span>
                    </td>

                    <td className="px-6 py-5">
                    <span className="font-semibold text-white">
                        {user.bookings_count ?? 0}
                    </span>
                    </td>

                    <td className="px-6 py-5 text-sm text-gray-400">
                    {new Date(
                        user.created_at
                    ).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                        <Link
                        href={
                            "/admin/users/edit/" +
                            user.id
                        }
                        className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-400 transition hover:bg-blue-500/20"
                        >
                        Edit
                        </Link>

                        <button
                        onClick={() =>
                            handleDelete(user.id)
                        }
                        disabled={
                            deletingId === user.id
                        }
                        className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                        {deletingId === user.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                    </div>
                    </td>
                </tr>
                ))}

                {users.length === 0 && (
                <tr>
                    <td
                    colSpan={6}
                    className="px-6 py-16 text-center"
                    >
                    <p className="text-gray-400">
                        No users found.
                    </p>
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
        </div>
    </div>
    </main>


    );
    }
