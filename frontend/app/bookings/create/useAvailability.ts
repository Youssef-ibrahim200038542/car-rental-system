"use client";

import { useEffect, useState } from "react";
import { apiFetch, errorMessage } from "@/lib/api";
import type { CarAvailability } from "@/lib/types";

/** An availability answer for one exact date range. */
type AvailabilityResult = CarAvailability & { key: string };

/**
 * Ask the server whether the car is free for [start, end]. `checking` is true
 * until the answer for the current range arrives; stale answers are ignored.
 */
export function useAvailability(carId: number | undefined, start: string, end: string, complete: boolean) {
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);

  const rangeKey = complete ? `${start}|${end}` : "";
  const current = availability && availability.key === rangeKey ? availability : null;

  useEffect(() => {
    if (!carId || !rangeKey) return;

    let cancelled = false;
    const [pickup, dropoff] = rangeKey.split("|");
    const query = new URLSearchParams({ pickup_date: pickup, return_date: dropoff });

    (async () => {
      try {
        const result = await apiFetch<CarAvailability>(`/cars/${carId}/availability?${query}`, {
          auth: false,
        });
        if (!cancelled) setAvailability({ ...result, key: rangeKey });
      } catch (err) {
        if (cancelled) return;
        setAvailability({
          key: rangeKey,
          available: false,
          reason: errorMessage(err, "Could not check availability for these dates."),
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [carId, rangeKey]);

  return {
    hasRange: Boolean(rangeKey),
    checking: Boolean(rangeKey) && !current,
    availability: current,
  };
}
