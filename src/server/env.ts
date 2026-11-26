import { z } from "zod";

// Server-only configuration. See .env.example for what each key does.
const optional = z.preprocess((v) => (v === "" ? undefined : v), z.string().min(1).optional());

const EnvSchema = z.object({
  DATABASE_URL: optional,
  CRON_SECRET: z.preprocess((v) => (v === "" ? undefined : v), z.string().min(16, "CRON_SECRET must be at least 16 characters").optional()),
  SYNC_TOP_ANIME: z.coerce.number().int().min(1).max(2000).default(250),
  SYNC_TOP_MANGA: z.coerce.number().int().min(1).max(2000).default(250),
  MANGADEX_USER_AGENT: z.string().default("Mugenkai/1.0"),
  ADMIN_EMAILS: z
    .string()
    .default("")
    .transform((s) => s.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)),
  RESEND_API_KEY: optional,
  EMAIL_FROM: z.string().default("Mugenkai <onboarding@resend.dev>"),
  /** Public origin for links in emails, e.g. https://mugenkai.app. Falls back to the request's origin. */
  APP_URL: z.preprocess((v) => (v === "" ? undefined : v), z.url().optional()),
  UPSTASH_REDIS_REST_URL: optional,
  UPSTASH_REDIS_REST_TOKEN: optional,
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = EnvSchema.parse(process.env);

/** Without a database the app runs in demo mode (bundled catalog, browser-only user data). */
export const backendEnabled = Boolean(env.DATABASE_URL);
