import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "./db";
import { backendEnabled, env } from "./env";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export const json = (data: unknown, init?: ResponseInit) => Response.json(data, init);

/** Wraps a route handler: known errors become JSON responses, unknown ones a logged 500. */
export function route<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.code, message: err.message }, { status: err.status });
      console.error(err);
      return json({ error: "internal_error" }, { status: 500 });
    }
  };
}

/**
 * Browsers always send Origin on cross-site writes; refusing a mismatch (on top of SameSite=Lax cookies)
 * blocks CSRF against the cookie session.
 */
export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) throw new HttpError(403, "missing_origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host || new URL(origin).host !== host) throw new HttpError(403, "cross_origin");
}

/** Parses a JSON body with a zod schema; 400 with field errors when it doesn't match. */
export async function readJson<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S>> {
  assertSameOrigin(req);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "invalid_json");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new HttpError(400, "invalid_body", z.prettifyError(parsed.error));
  return parsed.data;
}

// ─── Rate limiting (Upstash Redis when configured, bounded LRU Map fallback) ──

const MAX_RATE_KEYS = 10_000;
const hits = new Map<string, { count: number; resetAt: number }>();

function pruneRateMap(now: number) {
  if (hits.size < MAX_RATE_KEYS) return;
  for (const [k, v] of hits) {
    if (v.resetAt < now) hits.delete(k);
    if (hits.size < MAX_RATE_KEYS * 0.8) break;
  }
  while (hits.size >= MAX_RATE_KEYS) {
    const oldest = hits.keys().next().value;
    if (!oldest) break;
    hits.delete(oldest);
  }
}

function memoryRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    pruneRateMap(now);
    const resetAt = now + windowMs;
    hits.set(key, { count: 1, resetAt });
    return { ok: true, remaining: Math.max(0, limit - 1), resetAt };
  }
  entry.count += 1;
  // Refresh insertion order for LRU eviction.
  hits.delete(key);
  hits.set(key, entry);
  return {
    ok: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

async function upstashRateLimit(key: string, limit: number, windowMs: number) {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const redisKey = `rl:${key}`;
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["PTTL", redisKey],
      ]),
      signal: AbortSignal.timeout(800),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as [{ result?: number }, { result?: number }];
    const count = Number(data?.[0]?.result ?? 1);
    let ttl = Number(data?.[1]?.result ?? -1);
    if (ttl < 0) {
      ttl = windowMs;
      void fetch(`${url.replace(/\/$/, "")}/pexpire/${encodeURIComponent(redisKey)}/${windowMs}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(500),
      }).catch(() => {});
    }
    return {
      ok: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt: Date.now() + ttl,
    };
  } catch {
    return null;
  }
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const res = memoryRateLimit(key, limit, windowMs);
  if (!res.ok) {
    throw new HttpError(429, "rate_limited", "Too many attempts, try again in a minute");
  }
}

export async function checkRateLimit(req: Request, bucket: string, limit: number, windowMs: number) {
  const ip = clientIp(req);
  const key = `${bucket}:${ip}`;
  const res = (await upstashRateLimit(key, limit, windowMs)) ?? memoryRateLimit(key, limit, windowMs);
  const retryAfterSec = Math.max(1, Math.ceil((res.resetAt - Date.now()) / 1000));
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(res.remaining),
    "X-RateLimit-Reset": String(Math.ceil(res.resetAt / 1000)),
  };
  if (!res.ok) {
    headers["Retry-After"] = String(retryAfterSec);
    logSecurityEvent("RATE_LIMIT", ip, new URL(req.url).pathname, `bucket=${bucket} limit=${limit}`);
  }
  return { ...res, headers, retryAfterSec };
}

export function tooManyRequestsResponse(headers: Record<string, string>, extraHeaders?: Record<string, string>) {
  return NextResponse.json(
    { error: "rate_limited", message: "Too many requests. Please slow down." },
    { status: 429, headers: { ...extraHeaders, ...headers } },
  );
}

/**
 * CORS helper for proxy/stream routes: reflects same-origin or configured APP_URL origin,
 * preventing arbitrary third-party websites from hotlinking the stream proxy.
 */
export function getCorsHeaders(req: Request, methods = "GET, HEAD, OPTIONS"): Record<string, string> {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const allowedOrigin = env.APP_URL ? new URL(env.APP_URL).origin : null;
  const isSameHost = origin && host && (() => {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  })();

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Range, Content-Type, Accept",
    Vary: "Origin",
  };
  if (origin && (isSameHost || (allowedOrigin && origin === allowedOrigin))) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

export const clientIp = (req: Request) =>
  req.headers.get("cf-connecting-ip") ??
  req.headers.get("x-real-ip") ??
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
  "unknown";

// ─── Security event ring buffer + throttled DB logging ──────────────────────

export interface SecurityEventEntry {
  type: "RATE_LIMIT" | "SSRF_BLOCKED" | "AUTH_FAIL" | "ADMIN_ACTION";
  ip: string;
  path: string;
  detail?: string;
  createdAt: string;
}

const recentEvents: SecurityEventEntry[] = [];
const lastDbWrite = new Map<string, number>();

export function getRecentSecurityEvents(): SecurityEventEntry[] {
  return [...recentEvents];
}

export function logSecurityEvent(
  type: SecurityEventEntry["type"],
  ip: string,
  path: string,
  detail?: string,
) {
  const entry: SecurityEventEntry = { type, ip, path, detail, createdAt: new Date().toISOString() };
  recentEvents.unshift(entry);
  if (recentEvents.length > 100) recentEvents.pop();

  if (!backendEnabled) return;
  const throttleKey = `${type}:${ip}`;
  const now = Date.now();
  const prev = lastDbWrite.get(throttleKey) ?? 0;
  if (type !== "ADMIN_ACTION" && now - prev < 60_000) return;
  lastDbWrite.set(throttleKey, now);
  if (lastDbWrite.size > 2000) lastDbWrite.clear();

  void db()
    .securityEvent.create({ data: { type, ip, path, detail: detail?.slice(0, 500) } })
    .catch(() => {});
}
