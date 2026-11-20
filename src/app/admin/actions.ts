"use server";

import { requireAdmin } from "@/server/auth";
import { isJobName, runJob } from "@/server/sync/jobs";

/** Admin "Run now" button. Same code path as the cron routes. */
export async function runSync(job: string) {
  await requireAdmin();
  if (!isJobName(job)) throw new Error(`Unknown job: ${job}`);
  const result = await runJob(job);
  return result.ok ? { ok: true as const, ms: result.ms, summary: JSON.stringify(result.summary) } : { ok: false as const, error: result.error };
}
