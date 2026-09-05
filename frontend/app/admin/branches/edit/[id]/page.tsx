    "use client";

    import { useEffect, useState } from "react";
    import Link from "next/link";
    import { useParams, useRouter } from "next/navigation";

    type Branch = {
    id: number;
    name: string;
    address: string;
    city: string;
    phone: string;
    };

    export default function EditBranchPage() {
    const router = useRouter();
    const params = useParams();

    const id = params.id as string;

    const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

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

    fetchBranch();
    } catch {
    localStorage.removeItem("user");
    router.push("/login");
    }


    }, [router, id]);

    const fetchBranch = async () => {
    const token = localStorage.getItem("token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;


    try {
    const response = await fetch(
        apiUrl + "/branches/" + id,
        {
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + token,
        },
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
        data.message || "Failed to load branch."
        );
    }

    const branch: Branch = data.data;

    setFormData({
        name: branch.name || "",
        address: branch.address || "",
        city: branch.city || "",
        phone: branch.phone || "",
    });
    } catch (err) {
    setError(
        err instanceof Error
        ? err.message
        : "Failed to load branch."
    );
    } finally {
    setLoading(false);
    }


    };

    const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
    ) => {
    const { name, value } = e.target;


    setFormData((current) => ({
    ...current,
    [name]: value,
    }));


    };

    const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
    ) => {
    e.preventDefault();


    const token = localStorage.getItem("token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    setSaving(true);
    setError("");

    try {
    const response = await fetch(
        apiUrl + "/branches/" + id,
        {
        method: "PUT",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
        },
        body: JSON.stringify(formData),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        if (data.errors) {
        const firstError = Object.values(data.errors)
            .flat()
            .find(
            (message) =>
                typeof message === "string"
            );

        throw new Error(
            firstError || "Failed to update branch."
        );
        }

        throw new Error(
        data.message || "Failed to update branch."
        );
    }

    router.push("/admin/branches");
    } catch (err) {
    setError(
        err instanceof Error
        ? err.message
        : "Failed to update branch."
    );
    } finally {
    setSaving(false);
    }


    };

    if (loading) {
    return ( <main className="min-h-screen bg-[#050816] px-6 pb-20 pt-32 text-white"> <div className="mx-auto max-w-3xl"> <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center"> <p className="text-gray-400">
    Loading branch... </p> </div> </div> </main>
    );
    }

    return ( <main className="min-h-screen bg-[#050816] px-6 pb-20 pt-32 text-white"> <div className="mx-auto max-w-3xl"> <div className="mb-8"> <Link
            href="/admin/branches"
            className="inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
        >
    ← Back to Branches </Link>


        <h1 className="mt-6 text-4xl font-bold tracking-tight">
            Edit Branch
        </h1>

        <p className="mt-2 text-gray-400">
            Update the branch information.
        </p>
        </div>

        {error && (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
            {error}
        </div>
        )}

        <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8"
        >
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-xl">
            📍
            </div>

            <div>
            <p className="text-sm text-gray-500">
                Branch ID
            </p>

            <p className="font-semibold text-white">
                #{id}
            </p>
            </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-300">
                Branch Name
            </label>

            <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Cairo Main Branch"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500/50 focus:bg-white/[0.07]"
            />
            </div>

            <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-300">
                Address
            </label>

            <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main Street"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500/50 focus:bg-white/[0.07]"
            />
            </div>

            <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
                City
            </label>

            <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Cairo"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500/50 focus:bg-white/[0.07]"
            />
            </div>

            <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
                Phone
            </label>

            <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="01000000000"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500/50 focus:bg-white/[0.07]"
            />
            </div>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
            href="/admin/branches"
            className="rounded-xl border border-white/10 px-6 py-3 text-center text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
            >
            Cancel
            </Link>

            <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
            {saving ? "Saving..." : "Save Changes"}
            </button>
        </div>
        </form>
    </div>
    </main>


    );
    }
