import { ProgressStateSchema } from "@/data/schema";
import { requireUser } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { importProgress, readProgress } from "@/server/progress";

/** All of the signed-in user's progress, in the same shape the browser stores it. */
export const GET = route(async () => {
  const user = await requireUser();
  return json(await readProgress(user.id));
});

/** Import progress saved in the browser before signing in; returns the merged account state. */
export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const merged = await importProgress(user.id, await readJson(req, ProgressStateSchema));
  return json({ merged, state: await readProgress(user.id) });
});
