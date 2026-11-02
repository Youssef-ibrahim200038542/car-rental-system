"use client";

import { useCallback, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, errorMessage } from "@/lib/api";
import { redirectIfUnauthorized } from "@/lib/auth";

export type AdminList<T> = {
  items: T[];
  setItems: Dispatch<SetStateAction<T[]>>;
  /** True until the first response (success or failure) arrives. */
  loading: boolean;
  /** True while a reload() is in flight; the current items stay on screen. */
  refreshing: boolean;
  /** The collection could not be fetched; pages show ErrorState. */
  loadError: string;
  /** A delete/update on a loaded list failed; pages show ErrorAlert. */
  actionError: string;
  setActionError: (message: string) => void;
  reload: () => void;
};

/** Fetch one admin collection (GET `path`) with the shared loading/error shape. */
export function useAdminList<T>(path: string, loadFallback: string): AdminList<T> {
  const router = useRouter();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await apiFetch<T[]>(path);
        if (cancelled) return;
        setItems(Array.isArray(data) ? data : []);
        setLoadError("");
      } catch (err) {
        if (cancelled || redirectIfUnauthorized(err, router)) return;
        setLoadError(errorMessage(err, loadFallback));
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [path, loadFallback, router, reloadKey]);

  const reload = useCallback(() => {
    setRefreshing(true);
    setActionError("");
    setReloadKey((key) => key + 1);
  }, []);

  return {
    items,
    setItems,
    loading,
    refreshing,
    loadError,
    actionError,
    setActionError,
    reload,
  };
}

/**
 * DELETE one row of a loaded list and drop it locally on success. The caller
 * confirms first (ConfirmDialog); a failure lands in the list's actionError.
 */
export function useListRemoval<T extends { id: number }>(
  list: AdminList<T>,
  pathFor: (id: number) => string,
  fallback: string
) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { setItems, setActionError } = list;

  const remove = async (id: number) => {
    setDeletingId(id);
    setActionError("");

    try {
      await apiFetch(pathFor(id), { method: "DELETE" });
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      if (redirectIfUnauthorized(err, router)) return;
      setActionError(errorMessage(err, fallback));
    } finally {
      setDeletingId(null);
    }
  };

  return { deletingId, remove };
}
