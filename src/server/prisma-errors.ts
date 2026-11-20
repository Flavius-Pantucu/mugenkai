/** Prisma known-request error codes we act on: P2002 unique violation, P2003 FK, P2025 not found. */
export const hasPrismaCode = (err: unknown, code: "P2002" | "P2003" | "P2025") =>
  typeof err === "object" && err !== null && (err as { code?: unknown }).code === code;
