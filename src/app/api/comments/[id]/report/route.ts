import { z } from "zod";
import { getCurrentUser } from "@/server/auth";
import { db } from "@/server/db";
import { clientIp, HttpError, json, rateLimit, readJson, route } from "@/server/http";

const ReportSchema = z.object({
  reason: z.string().trim().min(3, "Please provide a reason").max(300),
});

export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  rateLimit(`report:${clientIp(req)}`, 10, 60_000);
  const { id } = await ctx.params;
  const input = await readJson(req, ReportSchema);
  const viewer = await getCurrentUser();

  const comment = await db().comment.findUnique({ where: { id }, select: { id: true, deletedAt: true } });
  if (!comment || comment.deletedAt) throw new HttpError(404, "not_found");

  await db().commentReport.create({
    data: {
      commentId: id,
      reporterId: viewer?.id ?? null,
      reason: input.reason,
    },
  });

  return json({ ok: true }, { status: 201 });
});
