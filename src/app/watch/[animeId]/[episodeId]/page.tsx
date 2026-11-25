import { notFound, redirect } from "next/navigation";
import { getAnime, parentSeries } from "@/server/catalog";
import { getFranchiseSeasons } from "@/server/details";
import { WatchPage } from "@/views/WatchPage";

export default async function Page({
  params,
}: {
  params: Promise<{ animeId: string; episodeId: string }>;
}) {
  const { animeId, episodeId } = await params;

  // If animeId is a season under a parent series (e.g. animeId = "195604" under parent "97940"):
  const parent = await parentSeries(animeId);
  if (parent) {
    const parentAnime = await getAnime(parent);
    if (parentAnime) {
      const season = parentAnime.seasons.find((s) => s.id === animeId);
      const seasonNum = season?.number ?? 1;
      const epMatch = episodeId.match(/-e(\d+)$/);
      const epNum = epMatch ? parseInt(epMatch[1], 10) : 1;
      const targetEp =
        parentAnime.episodes.find((e) => e.seasonNumber === seasonNum && e.episodeNumber === epNum) ??
        parentAnime.episodes.find((e) => e.seasonNumber === seasonNum);
      if (targetEp) {
        redirect(`/watch/${parent}/${targetEp.id}`);
      }
    }
  }

  const [anime, franchiseSeasons] = await Promise.all([
    getAnime(animeId),
    getFranchiseSeasons(animeId),
  ]);

  if (!anime || !anime.episodes.some((e) => e.id === episodeId)) {
    notFound();
  }

  return <WatchPage anime={anime} episodeId={episodeId} franchiseSeasons={franchiseSeasons} />;
}
