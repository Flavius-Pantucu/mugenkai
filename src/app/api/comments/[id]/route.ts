import { requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { assertSameOrigin, HttpError, json, route } from "@/server/http";

/** Soft delete: replies stay attached, the text is wiped. Author or admin only. */
export const DELETE = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { id } = await ctx.params;
  const comment = await db().comment.findUnique({ where: { id }, select: { userId: true, deletedAt: true } });
  if (!comment || comment.deletedAt) throw new HttpError(404, "not_found");
  if (comment.userId !== user.id && user.role !== "ADMIN") throw new HttpError(403, "forbidden");
  await db().comment.update({ where: { id }, data: { deletedAt: new Date(), body: "" } });
  return json({ ok: true });
});
