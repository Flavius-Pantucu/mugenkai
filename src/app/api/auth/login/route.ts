import { LoginSchema } from "@/data/schema";
import { createSession, hashPassword, toProfile, verifyPassword } from "@/server/auth";
import { db } from "@/server/db";
import { clientIp, HttpError, json, logSecurityEvent, rateLimit, readJson, route } from "@/server/http";

// Hash of a random password, verified when the email is unknown so both paths take the same time.
let dummyHash: Promise<string> | undefined;

export const POST = route(async (req: Request) => {
  const input = await readJson(req, LoginSchema);
  const email = input.email.toLowerCase();
  const ip = clientIp(req);
  rateLimit(`login:${ip}`, 20, 15 * 60_000);
  rateLimit(`login:${email}`, 10, 15 * 60_000);

  const user = await db().user.findUnique({ where: { email } });
  const ok = await verifyPassword(input.password, user?.passwordHash ?? (await (dummyHash ??= hashPassword(crypto.randomUUID()))));
  if (!user || !ok) {
    logSecurityEvent("AUTH_FAIL", ip, "/api/auth/login", `email=${email}`);
    throw new HttpError(401, "invalid_credentials", "Wrong email or password");
  }
  if (user.bannedAt) {
    throw new HttpError(403, "account_suspended", user.banReason || "This account has been suspended.");
  }

  await createSession(user.id);
  return json({ user: toProfile(user) });
});
