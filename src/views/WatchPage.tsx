"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CheckCheck, ChevronLeft, ChevronRight, ExternalLink, RotateCcw, Tv } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CommentSection } from "@/components/CommentSection";
import type { Anime } from "@/data/schema";
import { episodeLabel } from "@/data/series";
import { episodeProgress, saveEpisodeProgress, useProgress } from "@/lib/progress";
import { NotFoundPage } from "./NotFoundPage";

/**
 * Episodes stream on official sites (Crunchyroll, Netflix, …), not here. This page is the hub for one episode:
 * where to watch it, marking it watched, moving to the next one, and its discussion.
 */
export function WatchPage({ anime, episodeId }: { anime: Anime; episodeId: string }) {
  const router = useRouter();
  const progress = useProgress();
  const episode = anime.episodes.find((e) => e.id === episodeId);
  if (!episode) return <NotFoundPage />;

  // Where this episode streams officially: its own page when AniList has one, else the show's.
  const watchLinks = episode.links.length > 0 ? episode.links : anime.links;
  const index = anime.episodes.indexOf(episode);
  const prevEp = anime.episodes[index - 1];
  const nextEp = anime.episodes[index + 1];
  const epHref = (id: string) => `/watch/${anime.id}/${id}`;
  const watched = episodeProgress(progress, episode) >= 100;
  const seasonEpisodes = anime.episodes.filter((e) => e.seasonNumber === episode.seasonNumber);
  const multiSeason = anime.seasons.length > 1;

  const markWatched = (goNext: boolean) => {
    saveEpisodeProgress(episode.id, 100);
    if (goNext && nextEp) router.push(epHref(nextEp.id));
    else toast.success(`${episodeLabel(anime, episode)} marked watched`);
  };

  // Opening a stream doesn't mean it was watched; offer the shortcut for when they come back.
  const openedStream = () =>
    toast("Finished the episode?", { action: { label: "Mark watched", onClick: () => saveEpisodeProgress(episode.id, 100) }, duration: 15_000 });

  return (
    <div className="min-h-screen bg-ink pt-16">
      <div className="relative overflow-hidden">
        <img src={episode.thumbnail} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-2xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/70 to-ink" />

        <div className="relative mx-auto grid w-[90%] gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-12">
          <div className="space-y-6">
            <Link href={`/anime/${anime.id}`} className="inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white">
              <ChevronLeft className="size-4" />
              {anime.title}
            </Link>

            <div className="grid gap-6 md:grid-cols-[minmax(0,420px)_1fr] md:items-end">
              <div className="relative aspect-video overflow-hidden rounded-xl ring-1 ring-white/10">
                <img src={episode.thumbnail} alt="" className={cn("h-full w-full object-cover", watched && "opacity-60")} />
                <Badge className="absolute left-3 top-3 rounded-md bg-ink/80 font-bold tabular-nums text-white">{episodeLabel(anime, episode)}</Badge>
                {watched && (
                  <span className="absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground" aria-label="Watched">
                    <Check className="size-4" strokeWidth={3} />
                  </span>
                )}
              </div>

              <div>
                <p className="text-[13px] font-medium uppercase tracking-wide text-lagoon-200">
                  {multiSeason ? `Season ${episode.seasonNumber} · ` : ""}Episode {episode.episodeNumber}
                </p>
                <h1
                  className="mt-1 text-balance text-white"
                  style={{ fontFamily: "var(--font-family-heading)", fontSize: "clamp(1.5rem, 2.6vw, 2.2rem)", fontWeight: 900, lineHeight: 1.1 }}
                >
                  {episode.title}
                </h1>
                <p className="mt-2 text-sm text-zinc-400">{episode.duration} min</p>
              </div>
            </div>

            <Card className="gap-4 bg-ink-raised/80 p-5 backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Tv className="size-4 text-primary" />
                Where to watch
              </div>
              {watchLinks.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {watchLinks.slice(0, 6).map((l) => (
                    <Button key={l.url} asChild size="lg" variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                      <a href={l.url} target="_blank" rel="noopener noreferrer" onClick={openedStream}>
                        {l.provider}
                        <ExternalLink className="opacity-70" />
                      </a>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No official streaming link is known for this episode yet.</p>
              )}
              {episode.links.length === 0 && watchLinks.length > 0 && (
                <p className="text-xs text-muted-foreground">These open the show&apos;s page; pick episode {episode.episodeNumber} there.</p>
              )}

              <div className="flex flex-wrap gap-2 border-t border-white/5 pt-4">
                {watched ? (
                  <Button size="lg" variant="outline" onClick={() => saveEpisodeProgress(episode.id, 0)}>
                    <RotateCcw />
                    Mark unwatched
                  </Button>
                ) : (
                  <>
                    {nextEp && (
                      <Button size="lg" className="font-semibold" onClick={() => markWatched(true)}>
                        <CheckCheck />
                        Mark watched &amp; next
                      </Button>
                    )}
                    <Button size="lg" variant={nextEp ? "outline" : "default"} onClick={() => markWatched(false)}>
                      <Check />
                      Mark watched
                    </Button>
                  </>
                )}
              </div>
            </Card>

            <nav aria-label="Episodes" className="flex items-center justify-between gap-3">
              {prevEp ? (
                <Button asChild variant="ghost" className="min-w-0">
                  <Link href={epHref(prevEp.id)}>
                    <ChevronLeft />
                    <span className="truncate">Previous · {episodeLabel(anime, prevEp)}</span>
                  </Link>
                </Button>
              ) : (
                <span />
              )}
              {nextEp && (
                <Button asChild variant="ghost" className="min-w-0">
                  <Link href={epHref(nextEp.id)}>
                    <span className="truncate">Next · {episodeLabel(anime, nextEp)}</span>
                    <ChevronRight />
                  </Link>
                </Button>
              )}
            </nav>
          </div>

          <aside aria-label={multiSeason ? `Season ${episode.seasonNumber} episodes` : "Episodes"} className="lg:pt-10">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {multiSeason ? `Season ${episode.seasonNumber}` : "Episodes"} · {seasonEpisodes.length}
            </p>
            <ol className="max-h-[420px] space-y-1 overflow-y-auto rounded-xl bg-white/[0.02] p-1.5 ring-1 ring-white/5 lg:max-h-[560px]">
              {seasonEpisodes.map((ep) => {
                const current = ep.id === episode.id;
                const done = episodeProgress(progress, ep) >= 100;
                return (
                  <li key={ep.id}>
                    <Link
                      href={epHref(ep.id)}
                      aria-current={current ? "page" : undefined}
                      className={cn("flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/5", current && "bg-primary/15 hover:bg-primary/20")}
                    >
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded text-xs font-semibold tabular-nums",
                          current ? "bg-primary text-primary-foreground" : done ? "bg-primary/20 text-primary" : "bg-white/5 text-zinc-400",
                        )}
                      >
                        {done && !current ? <Check className="size-3.5" strokeWidth={3} /> : ep.episodeNumber}
                      </span>
                      <span className={cn("min-w-0 flex-1 truncate text-[13px]", current ? "text-white" : done ? "text-zinc-500" : "text-zinc-300")}>
                        {ep.title}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </aside>
        </div>
      </div>

      <CommentSection
        threadId={`episode:${episode.id}`}
        title={`${multiSeason ? `Season ${episode.seasonNumber} · ` : ""}Episode ${episode.episodeNumber} comments`}
        className="mx-auto w-[90%] max-w-3xl py-12"
      />
    </div>
  );
}
