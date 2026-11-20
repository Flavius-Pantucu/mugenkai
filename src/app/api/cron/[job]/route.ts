import { timingSafeEqual } from "node:crypto";
import { env } from "@/server/env";
import { HttpError, json, route } from "@/server/http";
import { isJobName, runJob } from "@/server/sync/jobs";

// Vercel Cron calls these with "Authorization: Bearer $CRON_SECRET" (see vercel.json).
// Run by hand: curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/catalog
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(req: Request) {
  if (!env.CRON_SECRET) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export const GET = route(async (req: Request, ctx: { params: Promise<{ job: string }> }) => {
  if (!authorized(req)) throw new HttpError(401, "unauthorized");
  const { job } = await ctx.params;
  if (!isJobName(job)) throw new HttpError(404, "unknown_job");
  const result = await runJob(job);
  return json(result, { status: result.ok ? 200 : 500 });
});
