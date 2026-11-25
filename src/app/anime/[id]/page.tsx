import { SeriesExtras } from "@/components/SeriesExtras";
import { getSeriesDetails } from "@/server/details";
import { notFound, redirect } from "next/navigation";
import { getAnime, getCatalog, getUpcomingEpisodes, parentSeries, related } from "@/server/catalog";
import { AnimeDetailsPage } from "@/views/AnimeDetailsPage";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const { id } = await params;
  const { season: querySeason } = await searchParams;
  // Later seasons (Stone Ocean under JoJo) live on their series' page, not as a separate one-season entry.
  const parent = await parentSeries(id);
  if (parent) redirect(`/anime/${parent}?season=${id}`);
  const [anime, catalog, details] = await Promise.all([getAnime(id), getCatalog(), getSeriesDetails(id)]);
  if (!anime) notFound();
  const upcoming = await getUpcomingEpisodes(anime);
  const summary = catalog.anime.find((a) => a.id === id) ?? anime;
  return (
    <AnimeDetailsPage
      anime={anime}
      upcoming={upcoming}
      related={related(catalog.anime, summary)}
      franchiseSeasons={details.franchiseSeasons}
      initialSeasonId={querySeason}
      extras={<SeriesExtras kind="anime" details={details} trailerYoutubeId={anime.trailerYoutubeId} />}
    />
  );
}
