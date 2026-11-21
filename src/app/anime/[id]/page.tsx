import { notFound } from "next/navigation";
import { getAnime, getCatalog, related } from "@/server/catalog";
import { AnimeDetailsPage } from "@/views/AnimeDetailsPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [anime, catalog] = await Promise.all([getAnime(id), getCatalog()]);
  if (!anime) notFound();
  const summary = catalog.anime.find((a) => a.id === id) ?? anime;
  return <AnimeDetailsPage anime={anime} related={related(catalog.anime, summary)} />;
}
