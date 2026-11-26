import type { Metadata } from "next";
import { getCurrentUser } from "@/server/auth";
import { backendEnabled } from "@/server/env";
import { getMyListData } from "@/server/my-list";
import { MyListPage } from "@/views/MyListPage";

export const metadata: Metadata = { title: "My List — Mugenkai" };

export default async function Page() {
  if (!backendEnabled) return <MyListPage data={null} signedIn={false} />;
  const user = await getCurrentUser();
  if (!user) return <MyListPage data={null} signedIn={false} />;
  const data = await getMyListData(user.id);
  return <MyListPage data={data} signedIn />;
}
