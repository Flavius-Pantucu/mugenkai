import { notFound } from "next/navigation";
import { getAnime } from "@/server/catalog";
import { getFranchiseSeasons } from "@/server/details";
import { WatchPage } from "@/views/WatchPage";

export default async function Page({
  params,
}: {
  params: Promise<{ animeId: string; episodeId: string }>;
}) {
  const { animeId, episodeId } = await params;

  const [anime, franchiseSeasons] = await Promise.all([
    getAnime(animeId),
    getFranchiseSeasons(animeId),
  ]);

  if (!anime || !anime.episodes.some((e) => e.id === episodeId)) {
    notFound();
  }

  return <WatchPage anime={anime} episodeId={episodeId} franchiseSeasons={franchiseSeasons} />;
}
