import { defineConfig } from "prisma/config";

// The Prisma CLI does not read .env files itself (Next.js does, for the app).
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file); // never overrides variables that are already set
  } catch {
    // file missing (e.g. on Vercel, where variables come from the project settings)
  }
}

// Migrations need a direct connection: poolers (Neon "-pooler", PgBouncer) break Prisma's advisory locks.
// process.env, not env(): `prisma generate` must work without a database configured.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL },
});
