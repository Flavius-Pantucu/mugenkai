import { requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { ListEntryInputSchema } from "@/data/schema";
import { assertSameOrigin, HttpError, json, readJson, route } from "@/server/http";
import { hasPrismaCode } from "@/server/prisma-errors";

type Ctx = { params: Promise<{ seriesId: string }> };

/** Add a title or change its status. Body: { status } (defaults to PLANNING). */
export const PUT = route(async (req: Request, ctx: Ctx) => {
  const { status } = await readJson(req, ListEntryInputSchema);
  const user = await requireUser();
  const { seriesId } = await ctx.params;
  try {
    await db().listEntry.upsert({
      where: { userId_seriesId: { userId: user.id, seriesId } },
      create: { userId: user.id, seriesId, status },
      update: { status },
    });
  } catch (err) {
    if (hasPrismaCode(err, "P2003")) throw new HttpError(404, "unknown_series");
    throw err;
  }
  return json({ ok: true });
});

export const DELETE = route(async (req: Request, ctx: Ctx) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { seriesId } = await ctx.params;
  await db().listEntry.deleteMany({ where: { userId: user.id, seriesId } });
  return json({ ok: true });
});
