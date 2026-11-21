import { notFound, redirect } from "next/navigation";
import { getAnime, getCatalog, parentSeries, related } from "@/server/catalog";
import { AnimeDetailsPage } from "@/views/AnimeDetailsPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Later seasons (Stone Ocean under JoJo) live on their series' page, not as a separate one-season entry.
  const parent = await parentSeries(id);
  if (parent) redirect(`/anime/${parent}`);
  const [anime, catalog] = await Promise.all([getAnime(id), getCatalog()]);
  if (!anime) notFound();
  const summary = catalog.anime.find((a) => a.id === id) ?? anime;
  return <AnimeDetailsPage anime={anime} related={related(catalog.anime, summary)} />;
}
