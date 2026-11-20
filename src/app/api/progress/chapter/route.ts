import { ChapterProgressInputSchema } from "@/data/schema";
import { requireUser } from "@/server/auth";
import { HttpError, json, readJson, route } from "@/server/http";
import { hasPrismaCode } from "@/server/prisma-errors";
import { writeChapter } from "@/server/progress";

export const PUT = route(async (req: Request) => {
  const user = await requireUser();
  const input = await readJson(req, ChapterProgressInputSchema);
  try {
    await writeChapter(user.id, input.chapterId, Math.min(input.page, input.pageCount), input.pageCount, input.updatedAt);
  } catch (err) {
    if (hasPrismaCode(err, "P2003")) throw new HttpError(404, "unknown_chapter");
    throw err;
  }
  return json({ ok: true });
});
