import { EpisodeProgressInputSchema } from "@/data/schema";
import { requireUser } from "@/server/auth";
import { HttpError, json, readJson, route } from "@/server/http";
import { hasPrismaCode } from "@/server/prisma-errors";
import { writeEpisode } from "@/server/progress";

export const PUT = route(async (req: Request) => {
  const user = await requireUser();
  const input = await readJson(req, EpisodeProgressInputSchema);
  try {
    await writeEpisode(user.id, input.episodeId, input.progress, input.updatedAt);
  } catch (err) {
    if (hasPrismaCode(err, "P2003")) throw new HttpError(404, "unknown_episode");
    throw err;
  }
  return json({ ok: true });
});
