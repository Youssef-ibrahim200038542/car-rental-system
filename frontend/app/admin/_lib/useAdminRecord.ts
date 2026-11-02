"use client";

import { useCallback, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, errorMessage, isApiError } from "@/lib/api";
import { redirectIfUnauthorized } from "@/lib/auth";

export type AdminRecord<T> = {
  data: T | null;
  setData: Dispatch<SetStateAction<T | null>>;
  loading: boolean;
  /** The record could not be fetched; pages show ErrorState. */
  error: string;
  /** Fetch again, showing LoadingState meanwhile (ErrorState's "Try again"). */
  reload: () => void;
};

/**
 * Fetch one admin record (GET `path`). `forbidden` replaces the server's
 * message on a 403 when the page has a clearer one to show.
 */
export function useAdminRecord<T>(
  path: string,
  fallback: string,
  forbidden?: string
): AdminRecord<T> {
  const router = useRouter();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const record = await apiFetch<T>(path, { signal: controller.signal });
        if (!record || typeof record !== "object") {
          throw new Error("The requested record could not be found.");
        }
        if (controller.signal.aborted) return;
        setData(record);
        setError("");
      } catch (err) {
        if (controller.signal.aborted || redirectIfUnauthorized(err, router)) return;
        setError(
          forbidden && isApiError(err, 403) ? forbidden : errorMessage(err, fallback)
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [path, fallback, forbidden, router, reloadKey]);

  const reload = useCallback(() => {
    setLoading(true);
    setError("");
    setReloadKey((key) => key + 1);
  }, []);

  return { data, setData, loading, error, reload };
}
