import { db } from "@/server/db";
import { backendEnabled } from "@/server/env";
import { json } from "@/server/http";

export const dynamic = "force-dynamic";

/** Liveness plus database reachability and the last run of each sync job. */
export async function GET() {
  if (!backendEnabled) return json({ status: "ok", mode: "demo" });
  try {
    const jobs = await db().syncState.findMany({ select: { job: true, lastOkAt: true, lastError: true } });
    return json({ status: "ok", mode: "database", jobs });
  } catch (err) {
    console.error(err);
    return json({ status: "degraded", mode: "database", error: "database_unreachable" }, { status: 503 });
  }
}
