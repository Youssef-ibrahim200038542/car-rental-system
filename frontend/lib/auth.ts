"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  AUTH_CHANGED_EVENT,
  USER_UPDATED_EVENT,
  apiFetch,
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
  | { status: "allowed"; user: User };

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
 * No token or a 401 → /login; a missing or wrong role → "/" (deny by default).
 */
export function useRequireRole(roles: readonly Role[]): AuthState {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ status: "loading", user: null });
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
        router.replace(isApiError(error, 401) ? "/login" : "/");
      });

    return () => {
      cancelled = true;
    };
  }, [router, rolesKey]);

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
