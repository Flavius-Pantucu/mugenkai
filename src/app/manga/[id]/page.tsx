import { notFound } from "next/navigation";
import { getCatalog, getManga, related } from "@/server/catalog";
import { MangaDetailsPage } from "@/views/MangaDetailsPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [manga, catalog] = await Promise.all([getManga(id), getCatalog()]);
  if (!manga) notFound();
  const summary = catalog.manga.find((m) => m.id === id) ?? {
    ...manga,
    firstChapterId: manga.chapters[0]?.id ?? null,
  };
  return <MangaDetailsPage manga={manga} related={related(catalog.manga, summary)} />;
}
