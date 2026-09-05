    "use client";

    import Link from "next/link";
    import { useSearchParams } from "next/navigation";

    export default function PaymentSuccessPage() {
    const searchParams = useSearchParams();

    const bookingId = searchParams.get("booking_id");

    return ( <main className="min-h-screen bg-[#070b14] px-6 pb-20 pt-32 text-white"> <div className="mx-auto flex min-h-[650px] max-w-3xl items-center justify-center"> <div className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-2xl md:p-12"> <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10 text-5xl">
    ✓ </div>


        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.25em] text-green-400">
            Payment Successful
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Booking Confirmed!
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-gray-400">
            Your payment has been processed successfully and your
            reservation is now confirmed.
        </p>

        {bookingId && (
            <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-600">
                Booking ID
            </p>

            <p className="mt-2 font-mono text-2xl font-bold text-white">
                #{bookingId}
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-400"></span>
                Confirmed
            </div>
            </div>
        )}

        <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="text-2xl">✓</div>
            <p className="mt-3 text-sm font-semibold">
                Payment Received
            </p>
            <p className="mt-1 text-xs leading-5 text-gray-500">
                Your payment has been recorded successfully.
            </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="text-2xl">🚘</div>
            <p className="mt-3 text-sm font-semibold">
                Car Reserved
            </p>
            <p className="mt-1 text-xs leading-5 text-gray-500">
                Your selected vehicle is linked to this booking.
            </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="text-2xl">📋</div>
            <p className="mt-3 text-sm font-semibold">
                Booking Confirmed
            </p>
            <p className="mt-1 text-xs leading-5 text-gray-500">
                You can view your reservation from your dashboard.
            </p>
            </div>
        </div>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
            href="/bookings"
            className="rounded-xl bg-blue-500 px-7 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600"
            >
            View My Bookings
            </Link>

            <Link
            href="/cars"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-7 py-3.5 font-semibold text-gray-300 transition hover:bg-white/[0.06] hover:text-white"
            >
            Browse More Cars
            </Link>
        </div>

        <p className="mt-8 text-xs text-gray-600">
            Thank you for choosing DriveX.
        </p>
        </div>
    </div>
    </main>


    );
    }
