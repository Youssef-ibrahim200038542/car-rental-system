"use client";

import { useEffect, useState } from "react";
import CarCard, { CarCardPill } from "@/app/components/CarCard";
import CarGridSkeleton from "@/app/components/CarGridSkeleton";
import SectionHeader from "@/app/components/SectionHeader";
import { apiFetch } from "@/lib/api";
import type { SimilarCar, SimilarCarsResult } from "@/lib/recommendation-types";

const LIMIT = 4;

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; similar: SimilarCar[] };

/** Content-based "cars like this one" strip under the car details. */
export default function SimilarCars({ carId }: { carId: number }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    apiFetch<SimilarCarsResult>(`/cars/${carId}/similar?limit=${LIMIT}`, { auth: false })
      .then((data) => {
        if (!cancelled) setState({ status: "ready", similar: data?.similar ?? [] });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [carId]);

  if (state.status === "ready" && state.similar.length === 0) return null;

  return (
    <section className="mt-14">
      <SectionHeader eyebrow="You may also like" title="Similar Cars" />

      {state.status === "loading" && (
        <CarGridSkeleton
          count={LIMIT}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4"
        />
      )}

      {state.status === "error" && (
        <p className="rounded-2xl border border-dashed border-[#d9d4c8] bg-white px-6 py-8 text-center text-sm text-[#898981]">
          Similar cars could not be loaded right now.
        </p>
      )}

      {state.status === "ready" && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {state.similar.map(({ car, similarity, reasons }) => (
            <CarCard
              key={car.id}
              car={car}
              badge={
                <CarCardPill title="How closely this car matches the one you are viewing">
                  {Math.round(similarity * 100)}% similar
                </CarCardPill>
              }
            >
              {reasons[0] && (
                <p className="mt-4 text-sm leading-6 text-[#526057]">
                  <span aria-hidden="true" className="mr-2 text-[#9a783c]">•</span>
                  {reasons[0]}
                </p>
              )}
            </CarCard>
          ))}
        </div>
      )}
    </section>
  );
}
