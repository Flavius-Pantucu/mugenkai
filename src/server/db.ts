import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "./env";
import { HttpError } from "./http";

// One client per server instance; dev hot-reload would otherwise open a new pool per edit.
const globalForPrisma = globalThis as { prisma?: PrismaClient };

export function db(): PrismaClient {
  if (!env.DATABASE_URL) throw new HttpError(503, "backend_disabled", "DATABASE_URL is not configured");
  globalForPrisma.prisma ??= new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });
  return globalForPrisma.prisma;
}
