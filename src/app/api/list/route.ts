import { requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { json, route } from "@/server/http";

/** The signed-in user's list, most recently changed first. */
export const GET = route(async () => {
  const user = await requireUser();
  const entries = await db().listEntry.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { seriesId: true, status: true, score: true },
  });
  return json({ entries });
});
