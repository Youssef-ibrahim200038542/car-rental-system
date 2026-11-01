
    "use client";

    import { FormEvent, Suspense, useState } from "react";
    import Link from "next/link";
    import { useRouter, useSearchParams } from "next/navigation";
    import { apiFetch, errorMessage, setSession } from "@/lib/api";
    import { homeForRole, safeRedirect } from "@/lib/auth";
    import type { AuthPayload } from "@/lib/types";

    export default function LoginPage() {
    return (
        <Suspense fallback={<main className="min-h-screen bg-[#f8f8f7]" />}>
        <LoginForm />
        </Suspense>
    );
    }

    function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const redirectParam = searchParams.get("redirect");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
        const { user, token } = await apiFetch<AuthPayload>("/login", {
            method: "POST",
            auth: false,
            body: { email: email.trim(), password },
        });

        if (!token || !user) {
            throw new Error("Invalid email or password.");
        }

        setSession(token, user);

        router.replace(safeRedirect(redirectParam) ?? homeForRole(user.role));
        router.refresh();
        } catch (err) {
        setError(errorMessage(err, "Something went wrong. Please try again."));
        } finally {
        setLoading(false);
        }
    }

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f8f7] px-6 py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(198,161,91,0.14),_transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(10,20,17,0.06),_transparent_35%)]" />

        <div className="relative w-full max-w-md">
            <div className="mb-8 text-center">
            <Link
                href="/"
                className="text-3xl font-bold tracking-tight text-[#0a1411]"
            >
                Drive<span className="text-[#b18b49]">X</span>
            </Link>

            <h1 className="mt-8 text-3xl font-bold text-[#0a1411]">
                Welcome back
            </h1>

            <p className="mt-3 text-[#77776f]">
                Sign in to continue to your account.
            </p>
            </div>

            <div className="rounded-3xl border border-[#e8e4db] bg-white p-8 shadow-[0_15px_50px_rgba(10,20,17,0.07)]">
            {error && (
                <div
                role="alert"
                className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-[#343830]"
                >
                    Email address
                </label>

                <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-[#e8e4db] bg-[#fafaf8] px-4 py-3.5 text-[#202020] placeholder:text-[#aaa99f] outline-none transition focus:border-[#c6a15b] focus:ring-1 focus:ring-[#c6a15b]"
                />
                </div>

                <div>
                <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-[#343830]"
                >
                    Password
                </label>

                <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-[#e8e4db] bg-[#fafaf8] px-4 py-3.5 text-[#202020] placeholder:text-[#aaa99f] outline-none transition focus:border-[#c6a15b] focus:ring-1 focus:ring-[#c6a15b]"
                />
                </div>

                <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#0a1411] py-3.5 font-semibold text-white transition hover:bg-[#1a3027] disabled:cursor-not-allowed disabled:opacity-60"
                >
                {loading ? "Signing in..." : "Sign In →"}
                </button>
            </form>

            <div className="mt-7 border-t border-[#e8e4db] pt-6 text-center">
                <p className="text-sm text-[#77776f]">
                Don&apos;t have an account?{" "}
                <Link
                    href="/register"
                    className="font-semibold text-[#9a783c] transition hover:text-[#74582a]"
                >
                    Create one
                </Link>
                </p>
            </div>
            </div>

            <div className="mt-6 text-center">
            <Link
                href="/"
                className="text-sm text-[#898981] transition hover:text-[#343830]"
            >
                ← Back to home
            </Link>
            </div>
        </div>
        </main>
    );
    }
