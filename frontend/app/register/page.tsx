"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, errorMessage, setSession } from "@/lib/api";
import PasswordField from "@/app/components/PasswordField";
import type { AuthPayload } from "@/lib/types";

export default function RegisterPage() {
const router = useRouter();

const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [phone, setPhone] = useState("");
const [password, setPassword] = useState("");
const [passwordConfirmation, setPasswordConfirmation] = useState("");

const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== passwordConfirmation) {
    setError("Passwords do not match.");
    return;
    }

    setLoading(true);

    try {
    const { user, token } = await apiFetch<AuthPayload>("/register", {
        method: "POST",
        auth: false,
        body: {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        password_confirmation: passwordConfirmation,
        },
    });

    setSession(token, user);

    router.push("/cars");
    } catch (err) {
    setError(errorMessage(err, "Something went wrong. Please try again."));
    } finally {
    setLoading(false);
    }
}

const inputClass =
    "w-full rounded-xl border border-[#e1e3dc] bg-[#f8f8f7] px-4 py-3.5 text-[#0a1411] placeholder:text-[#9ba29d] outline-none transition focus:border-[#c6a15b] focus:bg-white focus:ring-2 focus:ring-[#c6a15b]/15";

const labelClass =
    "mb-2 block text-sm font-semibold text-[#26352d]";

return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f8f7] px-5 py-28 sm:px-8">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(198,161,91,0.15),transparent_40%)]" />

    <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#0a1411]/[0.04] blur-[100px]" />

    <div className="relative w-full max-w-lg">
        <div className="mb-8 text-center">
        <Link
            href="/"
            className="inline-flex items-center text-3xl font-bold tracking-tight text-[#0a1411]"
        >
            Drive<span className="text-[#c6a15b]">X</span>
            <span className="ml-2 mt-1 h-2 w-2 rounded-full bg-[#c6a15b]" />
        </Link>

        <div className="mt-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#c6a15b]/30 bg-[#c6a15b]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#80612d]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#9a783c]" />
            Join DriveX
            </span>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-[#0a1411] sm:text-4xl">
            Create your account
            <span className="text-[#c6a15b]">.</span>
            </h1>

            <p className="mt-3 leading-6 text-[#68736d]">
            Create your account and get ready for your next ride.
            </p>
        </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-[#e5e6e1] bg-white shadow-xl shadow-[#0a1411]/[0.06]">
        <div className="h-1.5 bg-gradient-to-r from-[#0a1411] via-[#9a783c] to-[#c6a15b]" />

        <div className="p-6 sm:p-8">
            {error && (
            <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-6 text-red-700"
            >
                <span className="mt-0.5" aria-hidden="true">
                ⚠️
                </span>
                <p>{error}</p>
            </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label htmlFor="name" className={labelClass}>
                Full name
                </label>

                <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                maxLength={255}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your full name"
                className={inputClass}
                />
            </div>

            <div>
                <label htmlFor="email" className={labelClass}>
                Email address
                </label>

                <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={255}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className={inputClass}
                />
            </div>

            <div>
                <label htmlFor="phone" className={labelClass}>
                Phone number{" "}
                <span className="font-normal text-[#929a94]">
                    (Optional)
                </span>
                </label>

                <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="01XXXXXXXXX"
                className={inputClass}
                />
            </div>

            <PasswordField
                id="password"
                name="password"
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                toggleLabel="password"
                minLength={8}
                inputClassName={inputClass}
                labelClassName={labelClass}
                hint={<p className="mt-2 text-xs text-[#929a94]">Use at least 8 characters.</p>}
            />

            <PasswordField
                id="passwordConfirmation"
                name="password_confirmation"
                label="Confirm password"
                value={passwordConfirmation}
                onChange={setPasswordConfirmation}
                placeholder="Enter your password again"
                autoComplete="new-password"
                toggleLabel="confirmation password"
                minLength={8}
                inputClassName={inputClass}
                labelClassName={labelClass}
                hint={
                passwordConfirmation.length > 0 && (
                    <p
                    className={`mt-2 text-xs ${
                        password === passwordConfirmation ? "text-[#477451]" : "text-red-600"
                    }`}
                    >
                    {password === passwordConfirmation
                        ? "Passwords match."
                        : "Passwords do not match."}
                    </p>
                )
                }
            />

            <button
                type="submit"
                disabled={loading}
                className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0a1411] px-5 py-4 font-semibold text-white shadow-lg shadow-[#0a1411]/10 transition-all duration-200 hover:bg-[#c6a15b] hover:text-[#0a1411] focus:outline-none focus:ring-2 focus:ring-[#c6a15b] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#0a1411] disabled:hover:text-white"
            >
                {loading ? (
                <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating account...
                </>
                ) : (
                <>
                    Create Account
                    <span className="transition-transform duration-200 group-hover:translate-x-1">
                    →
                    </span>
                </>
                )}
            </button>
            </form>

            <div className="mt-7 border-t border-[#e5e6e1] pt-6 text-center">
            <p className="text-sm text-[#68736d]">
                Already have an account?{" "}
                <Link
                href="/login"
                className="font-bold text-[#80612d] transition hover:text-[#0a1411]"
                >
                Sign in
                </Link>
            </p>
            </div>
        </div>
        </div>

        <div className="mt-6 text-center">
        <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#929a94] transition hover:text-[#80612d]"
        >
            <span aria-hidden="true">←</span>
            Back to home
        </Link>
        </div>
    </div>
    </main>
);
}
