import { ProfileSettingsSchema } from "@/data/schema";
import { requireUser, toProfile } from "@/server/auth";
import { db } from "@/server/db";
import { HttpError, json, readJson, route } from "@/server/http";
import { hasPrismaCode } from "@/server/prisma-errors";

/** Update profile settings (Profile → Settings). */
export const PATCH = route(async (req: Request) => {
  const user = await requireUser();
  const input = await readJson(req, ProfileSettingsSchema);
  try {
    const updated = await db().user.update({ where: { id: user.id }, data: { ...input, email: input.email.toLowerCase() } });
    return json({ user: toProfile(updated) });
  } catch (err) {
    if (hasPrismaCode(err, "P2002")) throw new HttpError(409, "taken", "That username or email is already registered");
    throw err;
  }
});
