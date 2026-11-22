import { randomBytes } from "node:crypto";
import { after } from "next/server";
import { ForgotPasswordSchema } from "@/data/schema";
import { sha256 } from "@/server/auth";
import { db } from "@/server/db";
import { sendEmail } from "@/server/email";
import { env } from "@/server/env";
import { resetPasswordEmail } from "@/server/reset-email";
import { clientIp, json, rateLimit, readJson, route } from "@/server/http";

const TTL_MINUTES = 60;

export const POST = route(async (req: Request) => {
  const input = await readJson(req, ForgotPasswordSchema);
  const email = input.email.toLowerCase();
  rateLimit(`forgot:${clientIp(req)}`, 5, 15 * 60_000);
  rateLimit(`forgot:${email}`, 3, 15 * 60_000);

  const user = await db().user.findUnique({ where: { email } });
  if (user) {
    const token = randomBytes(32).toString("base64url");
    const link = `${env.APP_URL ?? new URL(req.url).origin}/reset-password?token=${token}`;
    await db().$transaction([
      db().passwordReset.deleteMany({ where: { userId: user.id } }),
      db().passwordReset.create({ data: { id: sha256(token), userId: user.id, expiresAt: new Date(Date.now() + TTL_MINUTES * 60_000) } }),
    ]);
    // Sent after the response so timing doesn't reveal which emails have accounts.
    after(() =>
      sendEmail({ to: user.email, ...resetPasswordEmail({ username: user.username, link, minutes: TTL_MINUTES }) }).catch((err) => console.error("password reset email failed", err)),
    );
  }
  // Same answer either way: no account enumeration.
  return json({ ok: true });
});
