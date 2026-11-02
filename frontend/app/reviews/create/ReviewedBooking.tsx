"use client";

import { useState } from "react";
import Image from "next/image";
import { carDisplayName } from "@/lib/cars";
import { getCarImageUrl } from "@/lib/car-images";
import { formatDate } from "@/lib/format";
import type { Booking } from "@/lib/types";

/** The completed booking being reviewed: photo, car name, id and dates. */
export default function ReviewedBooking({ booking }: { booking: Booking }) {
  const [imageError, setImageError] = useState(false);
  const carName = carDisplayName(booking.car);

  // Only the car's own uploaded photo; the "No Image" tile covers the rest.
  const carImage = booking.car?.image?.trim() ? getCarImageUrl(booking.car.image) : null;

  return (
    <section className="overflow-hidden rounded-3xl border border-[#e5e6e1] bg-white shadow-sm">
      <div className="h-1.5 bg-gradient-to-r from-[#0a1411] via-[#9a783c] to-[#c6a15b]" />

      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#e9e5da] bg-[#f8f8f7]">
            {carImage && !imageError ? (
              <Image
                src={carImage}
                alt={carName}
                width={96}
                height={96}
                unoptimized
                className="h-full w-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-medium text-[#929a94]">
                No Image
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-[#0a1411]">{carName}</h2>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#c6a15b]/30 bg-[#c6a15b]/10 px-3 py-1 text-xs font-semibold text-[#80612d]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#9a783c]" />
                Completed
              </span>
            </div>

            <p className="mt-3 text-sm font-medium text-[#68736d]">
              Booking <span className="font-bold text-[#0a1411]">#{booking.id}</span>
            </p>

            <p className="mt-2 text-sm text-[#68736d]">
              {formatDate(booking.pickup_date)}
              <span className="mx-2 text-[#c6a15b]">→</span>
              {formatDate(booking.return_date)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
