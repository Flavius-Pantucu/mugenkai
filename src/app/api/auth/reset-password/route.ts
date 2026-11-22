import { ResetPasswordSchema } from "@/data/schema";
import { hashPassword, sha256 } from "@/server/auth";
import { db } from "@/server/db";
import { clientIp, HttpError, json, rateLimit, readJson, route } from "@/server/http";

export const POST = route(async (req: Request) => {
  rateLimit(`reset:${clientIp(req)}`, 10, 15 * 60_000);
  const input = await readJson(req, ResetPasswordSchema);

  const reset = await db().passwordReset.findUnique({ where: { id: sha256(input.token) } });
  if (!reset || reset.expiresAt < new Date()) throw new HttpError(400, "invalid_token", "This reset link is invalid or has expired");

  // New password, every reset link spent, every device signed out.
  await db().$transaction([
    db().user.update({ where: { id: reset.userId }, data: { passwordHash: await hashPassword(input.password) } }),
    db().passwordReset.deleteMany({ where: { userId: reset.userId } }),
    db().session.deleteMany({ where: { userId: reset.userId } }),
  ]);
  return json({ ok: true });
});
