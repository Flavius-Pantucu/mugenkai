import { notFound } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { getCatalog } from "@/server/catalog";
import { db } from "@/server/db";
import { backendEnabled } from "@/server/env";
import { AdminPage, type AdminData } from "@/views/AdminPage";

export default async function Page() {
  const catalog = await getCatalog();
  if (!backendEnabled) return <AdminPage {...catalog} data={{ backend: false, users: [], jobs: [] }} />;

  // With a real backend this page is admin-only; everyone else gets a plain 404.
  const me = await getCurrentUser();
  if (me?.role !== "ADMIN") notFound();

  const [users, jobs] = await Promise.all([
    db().user.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, username: true, email: true, role: true, createdAt: true } }),
    db().syncState.findMany({ orderBy: { job: "asc" } }),
  ]);
  const data: AdminData = {
    backend: true,
    users: users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })),
    jobs: jobs.map((j) => ({
      job: j.job,
      lastRunAt: j.lastRunAt?.toISOString() ?? null,
      lastOkAt: j.lastOkAt?.toISOString() ?? null,
      lastError: j.lastError,
    })),
  };
  return <AdminPage {...catalog} data={data} />;
}
