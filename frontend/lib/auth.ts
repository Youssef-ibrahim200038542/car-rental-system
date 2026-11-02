"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  AUTH_CHANGED_EVENT,
  USER_UPDATED_EVENT,
  apiFetch,
  errorMessage,
  getStoredUserRaw,
  getToken,
  isApiError,
  setStoredUser,
} from "./api";
import type { Role, User } from "./types";

const SESSION_EVENTS = ["storage", AUTH_CHANGED_EVENT, USER_UPDATED_EVENT];

function subscribeToSession(onChange: () => void) {
  SESSION_EVENTS.forEach((name) => window.addEventListener(name, onChange));
  return () =>
    SESSION_EVENTS.forEach((name) => window.removeEventListener(name, onChange));
}

const noopSubscribe = () => () => {};

/** False during SSR and the hydration render, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

/** The cached signed-in user (localStorage), kept in sync across tabs and logins. */
export function useSessionUser(): User | null {
  const raw = useSyncExternalStore(subscribeToSession, getStoredUserRaw, () => null);

  return useMemo(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }, [raw]);
}

export type AuthState =
  | { status: "loading"; user: null }
  | { status: "allowed"; user: User }
  /** /me failed for a reason other than 401/403 (network, 5xx); `retry` re-runs it. */
  | { status: "error"; user: null; message: string; retry: () => void };

type Navigator = { replace: (href: string) => void };

/**
 * Send the user to /login when an API call failed with 401 (apiFetch has
 * already cleared the session). Returns true when it redirected.
 */
export function redirectIfUnauthorized(error: unknown, router: Navigator): boolean {
  if (!isApiError(error, 401)) return false;
  router.replace("/login");
  return true;
}

/** Where a signed-in user of this role lands by default. */
export function homeForRole(role?: Role): string {
  if (role === "admin") return "/admin";
  if (role === "staff") return "/staff";
  return "/cars";
}

/** Fetch the signed-in user from /me and refresh the cached copy. */
export async function fetchCurrentUser(): Promise<User> {
  const { user } = await apiFetch<{ user: User }>("/me");
  setStoredUser(user);
  return user;
}

/**
 * Guard a page: waits for /me, then allows only the given roles.
 * No token or a 401 → /login; a 403 or a wrong role → "/" (deny by default).
 * Any other failure (network, 5xx) keeps the user here in an "error" state
 * so the page can offer a retry instead of bouncing them home.
 */
export function useRequireRole(roles: readonly Role[]): AuthState {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ status: "loading", user: null });
  const [attempt, setAttempt] = useState(0);
  const rolesKey = roles.join(",");

  useEffect(() => {
    const allowed = rolesKey.split(",");
    let cancelled = false;

    if (!getToken()) {
      router.replace("/login");
      return;
    }

    fetchCurrentUser()
      .then((user) => {
        if (cancelled) return;

        if (!user.role || !allowed.includes(user.role)) {
          router.replace("/");
          return;
        }

        setState({ status: "allowed", user });
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        if (isApiError(error, 401)) {
          router.replace("/login");
        } else if (isApiError(error, 403)) {
          router.replace("/");
        } else {
          setState({
            status: "error",
            user: null,
            message: isApiError(error)
              ? errorMessage(error, "We could not verify your session.")
              : "We could not reach the server. Check your connection and try again.",
            retry: () => {
              setState({ status: "loading", user: null });
              setAttempt((count) => count + 1);
            },
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router, rolesKey, attempt]);

  return state;
}

/**
 * Same-origin path from a `?redirect=` value, or null. Resolving through URL
 * catches tricks like "/\t/evil.com" that a prefix check lets through.
 */
export function safeRedirect(value: string | null): string | null {
  if (!value || typeof window === "undefined") return null;

  try {
    const target = new URL(value, window.location.origin);
    if (target.origin !== window.location.origin) return null;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return null;
  }
}
