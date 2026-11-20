"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth";
import { db } from "@/server/db";
import { isJobName, runJob } from "@/server/sync/jobs";

/** "Run now". Same code path as the cron routes. */
export async function runSync(job: string) {
  await requireAdmin();
  if (!isJobName(job)) throw new Error(`Unknown job: ${job}`);
  const result = await runJob(job);
  revalidatePath("/admin");
  return result.ok ? { ok: true as const, ms: result.ms } : { ok: false as const, error: result.error };
}

/** Admins cannot act on their own account here, so nobody locks themselves out by accident. */
async function otherUser(userId: string) {
  const me = await requireAdmin();
  if (userId === me.id) throw new Error("You can't change your own account here");
  return userId;
}

export async function setUserRole(userId: string, role: "USER" | "ADMIN") {
  const id = await otherUser(userId);
  if (role !== "USER" && role !== "ADMIN") throw new Error("Unknown role");
  await db().user.update({ where: { id }, data: { role } });
  revalidatePath("/admin");
}

export async function signOutUser(userId: string) {
  const id = await otherUser(userId);
  await db().session.deleteMany({ where: { userId: id } });
  revalidatePath("/admin");
}

/** Cascades to sessions, progress, list, likes and comments (with the replies under them). */
export async function deleteUser(userId: string) {
  const id = await otherUser(userId);
  await db().user.delete({ where: { id } });
  revalidatePath("/admin");
}
