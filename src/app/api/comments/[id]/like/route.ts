import { requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { assertSameOrigin, HttpError, json, route } from "@/server/http";
import { hasPrismaCode } from "@/server/prisma-errors";

/** Toggles the viewer's like. Returns the new state and count. */
export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { id: commentId } = await ctx.params;
  const key = { userId_commentId: { userId: user.id, commentId } };

  const existing = await db().commentLike.findUnique({ where: key });
  try {
    if (existing) await db().commentLike.delete({ where: key });
    else await db().commentLike.create({ data: { userId: user.id, commentId } });
  } catch (err) {
    if (hasPrismaCode(err, "P2003")) throw new HttpError(404, "not_found");
    if (!hasPrismaCode(err, "P2002") && !hasPrismaCode(err, "P2025")) throw err; // double-click races are harmless
  }
  const likes = await db().commentLike.count({ where: { commentId } });
  return json({ liked: !existing, likes });
});
