    "use client";

    import { FormEvent, useState } from "react";
    import Link from "next/link";
    import { useRouter } from "next/navigation";

    type LoginResponse = {
    success: boolean;
    message: string;
    data?: {
        user: {
        id: number;
        name: string;
        email: string;
        phone?: string;
        role?: string;
        };
        token: string;
    };
    };

    export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/login`,
            {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                email,
                password,
            }),
            }
        );

        const data: LoginResponse = await response.json();

        if (!response.ok || !data.success || !data.data) {
            throw new Error(data.message || "Invalid email or password");
        }

        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));

        router.push("/cars");
        } catch (error) {
        setError(
            error instanceof Error
            ? error.message
            : "Something went wrong. Please try again."
        );
        } finally {
        setLoading(false);
        }
    }

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-32">
        {/* Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.10),_transparent_35%)]" />

        <div className="relative w-full max-w-md">

            {/* Header */}
            <div className="mb-8 text-center">
            <Link
                href="/"
                className="text-3xl font-bold tracking-tight text-white"
            >
                Drive<span className="text-blue-400">X</span>
            </Link>

            <h1 className="mt-8 text-3xl font-bold text-white">
                Welcome back
            </h1>

            <p className="mt-3 text-gray-500">
                Sign in to continue to your account.
            </p>
            </div>

            {/* Card */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-sm">

            {/* Error */}
            {error && (
                <div className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400">
                {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

                {/* Email */}
                <div>
                <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-gray-300"
                >
                    Email address
                </label>

                <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3.5 text-white placeholder:text-gray-600 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                </div>

                {/* Password */}
                <div>
                <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-gray-300"
                >
                    Password
                </label>

                <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3.5 text-white placeholder:text-gray-600 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                </div>

                {/* Submit */}
                <button
                type="submit"
                disabled={loading}
                className={`w-full rounded-xl py-3.5 font-semibold text-white transition ${
                    loading
                    ? "cursor-not-allowed bg-blue-500/50"
                    : "bg-blue-500 shadow-lg shadow-blue-500/20 hover:bg-blue-600"
                }`}
                >
                {loading ? "Signing in..." : "Sign In →"}
                </button>
            </form>

            {/* Register */}
            <div className="mt-7 border-t border-white/10 pt-6 text-center">
                <p className="text-sm text-gray-500">
                Don't have an account?{" "}
                <Link
                    href="/register"
                    className="font-semibold text-blue-400 transition hover:text-blue-300"
                >
                    Create one
                </Link>
                </p>
            </div>
            </div>

            {/* Back */}
            <div className="mt-6 text-center">
            <Link
                href="/"
                className="text-sm text-gray-600 transition hover:text-gray-400"
            >
                ← Back to home
            </Link>
            </div>
        </div>
        </main>
    );
    }