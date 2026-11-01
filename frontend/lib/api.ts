import type { ApiEnvelope, User } from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

/** Backend origin without the `/api` suffix, for /storage and /images assets. */
export const BACKEND_URL = API_URL.replace(/\/api\/?$/, "");

const TOKEN_KEY = "token";
const USER_KEY = "user";

/** Fired on window whenever the stored session changes (Navbar listens). */
export const AUTH_CHANGED_EVENT = "auth-changed";

function storage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function getToken(): string | null {
  return storage()?.getItem(TOKEN_KEY) ?? null;
}

export function getStoredUser(): User | null {
  const raw = storage()?.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    storage()?.removeItem(USER_KEY);
    return null;
  }
}

function notifyAuthChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}

export function setSession(token: string, user: User) {
  storage()?.setItem(TOKEN_KEY, token);
  storage()?.setItem(USER_KEY, JSON.stringify(user));
  notifyAuthChanged();
}

/** Fired when only the cached user object was refreshed (token unchanged). */
export const USER_UPDATED_EVENT = "session-user-updated";

/** Refresh the cached user without touching the token. */
export function setStoredUser(user: User) {
  storage()?.setItem(USER_KEY, JSON.stringify(user));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(USER_UPDATED_EVENT));
  }
}

/** Raw stored user JSON — a stable snapshot for useSyncExternalStore. */
export function getStoredUserRaw(): string | null {
  return storage()?.getItem(USER_KEY) ?? null;
}

export function clearSession() {
  storage()?.removeItem(TOKEN_KEY);
  storage()?.removeItem(USER_KEY);
  notifyAuthChanged();
}

export class ApiError extends Error {
  readonly status: number;
  /** Every validation message from a 422, flattened in field order. */
  readonly errors: string[];
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    fieldErrors: Record<string, string[]> = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.errors = Object.values(fieldErrors).flat();
  }
}

export function isApiError(error: unknown, status?: number): error is ApiError {
  return (
    error instanceof ApiError && (status === undefined || error.status === status)
  );
}

/** A user-facing message for anything a page's catch block receives. */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.errors[0] || error.message || fallback;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Plain objects are sent as JSON; FormData is sent as multipart. */
  body?: unknown;
  /** Send the stored bearer token (default true). */
  auth?: boolean;
  signal?: AbortSignal;
};

/**
 * Call the Laravel API and return the envelope's `data`.
 * Throws ApiError on any non-2xx or `success: false`; a 401 also clears the session.
 */
export async function apiFetch<T>(
  path: string,
  { method = "GET", body, auth = true, signal }: ApiFetchOptions = {}
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : isFormData
          ? (body as FormData)
          : JSON.stringify(body),
    cache: "no-store",
    signal,
  });

  const envelope = (await response
    .json()
    .catch(() => ({}))) as ApiEnvelope<T>;

  if (response.status === 401 && auth) {
    clearSession();
  }

  // Laravel 422 bodies are `{message, errors}` without `success`, so `ok` decides.
  if (!response.ok) {
    const message =
      response.status === 429
        ? "Too many attempts. Please wait a minute and try again."
        : envelope.message || `Request failed (${response.status}).`;

    throw new ApiError(response.status, message, envelope.errors);
  }

  return envelope.data as T;
}
