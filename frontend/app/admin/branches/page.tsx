    "use client";

    import { useEffect, useState } from "react";
    import Link from "next/link";
    import { useRouter } from "next/navigation";

    type Branch = {
    id: number;
    name: string;
    address?: string | null;
    phone?: string | null;
    };

    export default function AdminBranchesPage() {
    const router = useRouter();

    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const fetchBranches = async () => {
    const token = localStorage.getItem("token");


    if (!token) {
    router.push("/login");
    return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    try {
    const response = await fetch(apiUrl + "/branches", {
        headers: {
        Accept: "application/json",
        Authorization: "Bearer " + token,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to load branches.");
    }

    const data = await response.json();

    setBranches(data.data || []);
    } catch (err) {
    setError(
        err instanceof Error
        ? err.message
        : "Failed to load branches."
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

    fetchBranches();
    } catch {
    localStorage.removeItem("user");
    router.push("/login");
    }


    }, [router]);

    const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
    "Are you sure you want to delete this branch?"
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
        apiUrl + "/branches/" + id,
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
        data.message ||
            "Failed to delete branch. It may be used by cars or bookings."
        );
    }

    setBranches((currentBranches) =>
        currentBranches.filter(
        (branch) => branch.id !== id
        )
    );
    } catch (err) {
    setError(
        err instanceof Error
        ? err.message
        : "Failed to delete branch."
    );
    } finally {
    setDeletingId(null);
    }


    };

    if (loading) {
    return ( <main className="min-h-screen bg-[#050816] px-6 pb-20 pt-32 text-white"> <div className="mx-auto max-w-7xl"> <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center"> <p className="text-gray-400">
    Loading branches... </p> </div> </div> </main>
    );
    }

    return ( <main className="min-h-screen bg-[#050816] px-6 pb-20 pt-32 text-white"> <div className="mx-auto max-w-7xl"> <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"> <div> <Link
            href="/admin"
            className="mb-5 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
            >
    ← Back to Dashboard </Link>


            <h1 className="text-4xl font-bold tracking-tight">
            Manage Branches
            </h1>

            <p className="mt-2 text-gray-400">
            Manage your rental branches and locations.
            </p>
        </div>

        <Link
            href="/admin/branches/create"
            className="rounded-xl bg-blue-500 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600"
        >
            + Add New Branch
        </Link>
        </div>

        {error && (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
            {error}
        </div>
        )}

        <div className="mb-8 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-gray-400">
            Total Branches
            </p>

            <p className="mt-2 text-3xl font-bold">
            {branches.length}
            </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-gray-400">
            Locations
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-400">
            {branches.length}
            </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-gray-400">
            Management
            </p>

            <p className="mt-2 text-lg font-semibold text-green-400">
            Active
            </p>
        </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => (
            <div
            key={branch.id}
            className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-blue-500/20 hover:bg-white/[0.05]"
            >
            <div className="mb-6 flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
                📍
                </div>

                <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                Active
                </span>
            </div>

            <h2 className="text-xl font-semibold text-white">
                {branch.name}
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
                {branch.address || "No address provided"}
            </p>

            {branch.phone && (
                <p className="mt-3 text-sm text-gray-500">
                📞 {branch.phone}
                </p>
            )}

            <div className="mt-6 border-t border-white/10 pt-5">
                <p className="text-xs uppercase tracking-wider text-gray-600">
                Branch ID
                </p>

                <p className="mt-1 text-sm font-medium text-gray-300">
                #{branch.id}
                </p>
            </div>

            <div className="mt-5 flex gap-2">
                <Link
                href={"/admin/branches/edit/" + branch.id}
                className="flex-1 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-center text-sm font-medium text-blue-400 transition hover:bg-blue-500/20"
                >
                Edit
                </Link>

                <button
                onClick={() => handleDelete(branch.id)}
                disabled={deletingId === branch.id}
                className="flex-1 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                {deletingId === branch.id
                    ? "Deleting..."
                    : "Delete"}
                </button>
            </div>
            </div>
        ))}

        {branches.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center md:col-span-2 lg:col-span-3">
            <div className="text-4xl">📍</div>

            <p className="mt-4 text-gray-400">
                No branches found.
            </p>

            <Link
                href="/admin/branches/create"
                className="mt-4 inline-block text-sm text-blue-400 transition hover:text-blue-300"
            >
                Add your first branch →
            </Link>
            </div>
        )}
        </div>
    </div>
    </main>


    );
    }
