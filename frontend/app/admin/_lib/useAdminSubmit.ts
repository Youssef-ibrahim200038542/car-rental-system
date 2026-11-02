"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { errorMessage } from "@/lib/api";
import { redirectIfUnauthorized } from "@/lib/auth";

/**
 * Run a form's save action with the shared saving/error shape. `action` does
 * the API call and any navigation; `saving` stays true after success so the
 * button keeps its busy label while the next page loads.
 */
export function useAdminSubmit<V>(
  action: (values: V) => Promise<void>,
  fallback: string
) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (values: V) => {
    setSaving(true);
    setError("");

    try {
      await action(values);
    } catch (err) {
      setSaving(false);
      if (redirectIfUnauthorized(err, router)) return;
      setError(errorMessage(err, fallback));
    }
  };

  return { saving, error, setError, submit };
}
