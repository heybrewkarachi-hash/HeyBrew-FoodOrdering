import type { ApiErrorBody } from "@heybrew/shared";

export const API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:4000";

export const UI_COOKIE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ADMIN_UI_COOKIE) ||
  "heybrew_admin_ui";

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let csrfToken: string | null = null;
let csrfPromise: Promise<string> | null = null;

function isMutating(method: string): boolean {
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

export async function fetchCsrf(force = false): Promise<string> {
  if (!force && csrfToken) return csrfToken;
  if (!force && csrfPromise) return csrfPromise;

  csrfPromise = (async () => {
    const res = await fetch(`${API_BASE}/api/v1/admin/auth/csrf`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new ApiError(res.status, "CSRF_ERROR", "Failed to fetch CSRF token");
    }
    const data = (await res.json()) as { csrfToken?: string; token?: string };
    const token = data.csrfToken ?? data.token;
    if (!token) {
      throw new ApiError(res.status, "CSRF_ERROR", "CSRF token missing from response");
    }
    csrfToken = token;
    return token;
  })();

  try {
    return await csrfPromise;
  } finally {
    csrfPromise = null;
  }
}

export function clearCsrf() {
  csrfToken = null;
}

async function parseError(res: Response): Promise<ApiError> {
  let body: ApiErrorBody | null = null;
  try {
    body = (await res.json()) as ApiErrorBody;
  } catch {
    /* ignore */
  }
  const code = body?.error?.code ?? "HTTP_ERROR";
  const message =
    body?.error?.message ?? (res.statusText || `Request failed (${res.status})`);
  return new ApiError(res.status, code, message, body?.error?.details);
}

export type ApiOptions = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Skip CSRF for this call (rare). */
  skipCsrf?: boolean;
};

function buildUrl(path: string, query?: ApiOptions["query"]): string {
  const base = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  if (!query) return base;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * Fetch wrapper for the HeyBrew admin API.
 * Always sends credentials. Fetches CSRF before mutating requests.
 */
export async function apiFetch<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (isMutating(method) && !options.skipCsrf) {
    const token = await fetchCsrf();
    headers["X-CSRF-Token"] = token;
  }

  const res = await fetch(buildUrl(path, options.query), {
    method,
    credentials: "include",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    if (res.status === 403 && isMutating(method) && !options.skipCsrf) {
      // Retry once with a fresh CSRF token
      clearCsrf();
      const token = await fetchCsrf(true);
      headers["X-CSRF-Token"] = token;
      const retry = await fetch(buildUrl(path, options.query), {
        method,
        credentials: "include",
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: options.signal,
      });
      if (retry.status === 204) return undefined as T;
      if (!retry.ok) throw await parseError(retry);
      if (retry.headers.get("content-type")?.includes("application/json")) {
        return (await retry.json()) as T;
      }
      return undefined as T;
    }
    throw await parseError(res);
  }

  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    return (await res.json()) as T;
  }
  return undefined as T;
}

export const api = {
  get: <T>(path: string, query?: ApiOptions["query"], signal?: AbortSignal) =>
    apiFetch<T>(path, { method: "GET", query, signal }),
  post: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "PUT", body }),
  delete: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "DELETE", body }),
};

/** Normalize list responses that may be `{ items }` or a bare array. */
export function unwrapList<T>(data: T[] | { items: T[]; [k: string]: unknown }): {
  items: T[];
  page?: number;
  limit?: number;
  total?: number;
} {
  if (Array.isArray(data)) return { items: data };
  return {
    items: data.items ?? [],
    page: typeof data.page === "number" ? data.page : undefined,
    limit: typeof data.limit === "number" ? data.limit : undefined,
    total: typeof data.total === "number" ? data.total : undefined,
  };
}

/** Map `_id` → `id` for Mongo-shaped documents. */
export function withId<T extends Record<string, unknown>>(doc: T): T & { id: string } {
  const id =
    (typeof doc.id === "string" && doc.id) ||
    (typeof doc._id === "string" && doc._id) ||
    (doc._id != null ? String(doc._id) : "");
  return { ...doc, id };
}

export function mapIds<T extends Record<string, unknown>>(docs: T[]): (T & { id: string })[] {
  return docs.map(withId);
}
