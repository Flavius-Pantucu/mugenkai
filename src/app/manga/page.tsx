import { getCatalog } from "@/server/catalog";
import { MangaPage } from "@/views/MangaPage";

export default async function Page() {
  return <MangaPage items={(await getCatalog()).manga} />;
}
