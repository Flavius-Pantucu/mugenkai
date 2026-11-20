"use client";

// Client side of the API: one place that knows whether we talk to a real backend.
// AuthProvider sets the mode once /api/auth/me answers.

let remote = false;

/** True when a database backs the app and a user is signed in: writes go to the API. */
export const isRemote = () => remote;
export const setRemote = (on: boolean) => {
  remote = on;
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(path, {
    method: init.method ?? (init.body === undefined ? "GET" : "POST"),
    headers: init.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    credentials: "same-origin",
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
  if (!res.ok) throw new ApiError(res.status, data.error ?? "error", data.message ?? `Request failed (${res.status})`);
  return data as T;
}
