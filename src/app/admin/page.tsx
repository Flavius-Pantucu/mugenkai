import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminData } from "@/server/admin";
import { getCurrentUser } from "@/server/auth";
import { backendEnabled } from "@/server/env";
import { AdminPage } from "@/views/AdminPage";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function Page() {
  if (!backendEnabled) return <AdminPage data={null} />;

  // Admin-only; everyone else gets a plain 404.
  const me = await getCurrentUser();
  if (me?.role !== "ADMIN") notFound();
  return <AdminPage data={await getAdminData(me.id)} />;
}
