import { RegisterSchema } from "@/data/schema";
import { createSession, hashPassword, isAdminEmail, toProfile } from "@/server/auth";
import { db } from "@/server/db";
import { clientIp, HttpError, json, rateLimit, readJson, route } from "@/server/http";
import { hasPrismaCode } from "@/server/prisma-errors";
import { getSiteConfig } from "@/server/site-config";

export const POST = route(async (req: Request) => {
  rateLimit(`register:${clientIp(req)}`, 5, 60_000);
  const cfg = await getSiteConfig();
  if (!cfg.registrationOpen) {
    throw new HttpError(403, "registration_closed", "New account registration is currently closed");
  }
  const input = await readJson(req, RegisterSchema);
  const email = input.email.toLowerCase();

  try {
    const user = await db().user.create({
      data: {
        email,
        username: input.username,
        passwordHash: await hashPassword(input.password),
        role: isAdminEmail(email) ? "ADMIN" : "USER",
      },
    });
    await createSession(user.id);
    return json({ user: toProfile(user) }, { status: 201 });
  } catch (err) {
    if (hasPrismaCode(err, "P2002")) throw new HttpError(409, "taken", "That username or email is already registered");
    throw err;
  }
});
