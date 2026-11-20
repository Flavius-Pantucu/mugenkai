import { z } from "zod";

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

// ponytail: per-instance memory, so limits are approximate on serverless; move to Upstash/Redis if abused.
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (++entry.count > limit) throw new HttpError(429, "rate_limited", "Too many attempts, try again in a minute");
}

export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
