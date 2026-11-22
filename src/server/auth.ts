import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { User } from "@/generated/prisma/client";
import type { UserProfile } from "@/data/schema";
import { db } from "./db";
import { env } from "./env";
import { HttpError } from "./http";

export { hashPassword, verifyPassword } from "./password";

// ─── Sessions: random token in an httpOnly cookie, SHA-256 of it in the DB ────

const COOKIE = "mk_session";
const SESSION_DAYS = 30;
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db().session.create({ data: { id: sha256(token), userId, expiresAt } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db().session.deleteMany({ where: { id: sha256(token) } });
  jar.delete(COOKIE);
}

/** The signed-in user, or null. Expired sessions are removed on sight. */
export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db().session.findUnique({ where: { id: sha256(token) }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db().session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "unauthorized", "Sign in first");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new HttpError(403, "forbidden");
  return user;
}

export const isAdminEmail = (email: string) => env.ADMIN_EMAILS.includes(email.toLowerCase());

/** What the browser is allowed to see about a user. Never includes the password hash. */
export function toProfile(u: User): UserProfile {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    avatarUrl: u.avatarUrl,
    bio: u.bio,
    role: u.role,
    matureContent: u.matureContent,
    notifications: u.notifications,
  };
}
