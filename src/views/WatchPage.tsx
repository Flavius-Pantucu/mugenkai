"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Radio,
  RotateCcw,
  Server,
  Sparkles,
  Tv,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CommentSection } from "@/components/CommentSection";

import type { Anime } from "@/data/schema";
import { episodeLabel } from "@/data/series";
import {
  episodeProgress,
  saveEpisodeProgress,
  useProgress,
} from "@/lib/progress";

import { NotFoundPage } from "./NotFoundPage";

const SERVERS = [
  { id: "flow", label: "Flow (HD-1)", tip: "Fastest stream, OP/ED auto-skip" },
  { id: "kitty", label: "Kitty (HD-2)", tip: "Backup mirror for Flow" },
  { id: "yuri", label: "Yuri (Multi-Sub)", tip: "Soft subtitles, 16 languages" },
  { id: "zuri", label: "Zuri (Raw/Sub)", tip: "Japanese audio fallback" },
  { id: "buzz", label: "Buzz (HD-3)", tip: "Extra backup server" },
] as const;

type ServerId = (typeof SERVERS)[number]["id"];

/**
 * Episodes are embedded through AniFlow's multi-source engine.
 * Supports 5 streaming backends (Flow, Kitty, Yuri, Zuri, MegaPlay Buzz),
 * Sub/Dub switching, auto-skip intro/outro, and automated progress tracking.
 */
export function WatchPage({
  anime,
  episodeId,
}: {
  anime: Anime;
  episodeId: string;
}) {
  const router = useRouter();
  const progress = useProgress();

  const [server, setServer] = useState<ServerId>("flow");
  const [audio, setAudio] = useState<"sub" | "dub">("sub");
  const [autoSkip, setAutoSkip] = useState(true);

  const episode = anime.episodes.find((e) => e.id === episodeId);

  if (!episode) return <NotFoundPage />;

  const index = anime.episodes.indexOf(episode);

  const prevEp = anime.episodes[index - 1];
  const nextEp = anime.episodes[index + 1];

  const epHref = (id: string) => `/watch/${anime.id}/${id}`;

  const watched = episodeProgress(progress, episode) >= 100;

  const seasonEpisodes = anime.episodes.filter(
    (e) => e.seasonNumber === episode.seasonNumber,
  );

  const multiSeason = anime.seasons.length > 1;

  // Find the selected episode's season.
  const season = anime.seasons.find((s) => s.number === episode.seasonNumber);

  // Sync audio with server (zuri is sub-only)
  const handleAudioChange = (newAudio: "sub" | "dub") => {
    setAudio(newAudio);
    if (newAudio === "dub" && server === "zuri") {
      setServer("flow");
    }
  };

  // Embedded through the local AniFlow embed route
  const streamUrl = season
    ? `/embed/ani/${season.id}/${episode.episodeNumber}/${audio}?server=${server}&autoskipIntro=${autoSkip ? 1 : 0}&autoskipOutro=${autoSkip ? 1 : 0}`
    : null;

  // Listen for playback progress from AniFlow's postMessage bridge
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg?.source !== "aniembed") return;

      if (msg.name === "progress" && typeof msg.data?.percent === "number") {
        const p = Math.round(msg.data.percent);
        if (p > 0) {
          saveEpisodeProgress(episode.id, p);
        }
      } else if (msg.name === "ended") {
        saveEpisodeProgress(episode.id, 100);
        toast.success(`${episodeLabel(anime, episode)} finished!`);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [episode.id, anime, episode]);

  const markWatched = (goNext: boolean) => {
    saveEpisodeProgress(episode.id, 100);

    if (goNext && nextEp) {
      router.push(epHref(nextEp.id));
    } else {
      toast.success(`${episodeLabel(anime, episode)} marked watched`);
    }
  };

  return (
    <div className="min-h-screen bg-ink pt-16">
      <div className="relative overflow-hidden">
        <img
          src={episode.thumbnail}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-2xl"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/70 to-ink" />

        <div className="relative mx-auto grid w-[90%] gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-12">
          {/* Main content */}
          <div className="space-y-6">
            {/* Back to anime */}
            <Link
              href={`/anime/${anime.id}`}
              className="inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
            >
              <ChevronLeft className="size-4" />
              {anime.title}
            </Link>

            {/* Video Player */}
            <Card className="gap-4 bg-ink-raised/80 p-3 backdrop-blur sm:p-5">
              {/* Embed Video Frame */}
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
                {streamUrl ? (
                  <iframe
                    key={streamUrl}
                    src={streamUrl}
                    title={`${anime.title} - Episode ${episode.episodeNumber}`}
                    className="absolute inset-0 h-full w-full border-0"
                    allowFullScreen
                    allow="autoplay; fullscreen; picture-in-picture"
                    scrolling="no"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-center text-sm text-zinc-400">
                    Could not find this episode's season. Check the season data
                    in your catalog.
                  </div>
                )}
              </div>

              {/* Controls & Server Switcher (AFTER the player) */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Server selector pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                      <Server className="size-3.5" />
                      Server:
                    </span>
                    {SERVERS.map((s) => {
                      const isSelected = server === s.id;
                      const isDubDisabled = audio === "dub" && s.id === "zuri";
                      return (
                        <button
                          key={s.id}
                          type="button"
                          disabled={isDubDisabled}
                          onClick={() => setServer(s.id)}
                          title={s.tip}
                          className={cn(
                            "rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                            isSelected
                              ? "bg-lagoon-500/25 text-lagoon-200 ring-1 ring-lagoon-400/50 shadow-sm"
                              : "bg-black/30 text-zinc-400 hover:bg-white/5 hover:text-zinc-200 ring-1 ring-white/5",
                            isDubDisabled && "opacity-40 cursor-not-allowed",
                          )}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Audio Toggle (SUB / DUB) & Auto-Skip */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="inline-flex rounded-lg bg-black/40 p-1 ring-1 ring-white/10">
                      <button
                        type="button"
                        onClick={() => handleAudioChange("sub")}
                        className={cn(
                          "rounded px-2.5 py-1 font-semibold transition-all cursor-pointer",
                          audio === "sub"
                            ? "bg-primary text-primary-foreground shadow"
                            : "text-zinc-400 hover:text-white",
                        )}
                      >
                        SUB
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAudioChange("dub")}
                        className={cn(
                          "rounded px-2.5 py-1 font-semibold transition-all cursor-pointer",
                          audio === "dub"
                            ? "bg-primary text-primary-foreground shadow"
                            : "text-zinc-400 hover:text-white",
                        )}
                      >
                        DUB
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAutoSkip((prev) => !prev)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition-colors ring-1 ring-white/10 cursor-pointer",
                        autoSkip
                          ? "bg-primary/15 text-primary ring-primary/30"
                          : "bg-black/40 text-zinc-400 hover:text-white",
                      )}
                      title="Automatically skip intro/outro themes"
                    >
                      <Sparkles className="size-3.5" />
                      Auto-Skip: {autoSkip ? "ON" : "OFF"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2 text-xs text-muted-foreground">
                  <p>
                    Switch servers if a title is missing or buffering.
                  </p>
                </div>
              </div>
            </Card>

            {/* Watch progress controls */}
            <Card className="gap-4 bg-ink-raised/80 p-5 backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <CheckCheck className="size-4 text-primary" />
                Episode progress
              </div>

              <div className="flex flex-wrap gap-2">
                {watched ? (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => saveEpisodeProgress(episode.id, 0)}
                  >
                    <RotateCcw />
                    Mark unwatched
                  </Button>
                ) : (
                  <>
                    {nextEp && (
                      <Button
                        size="lg"
                        className="font-semibold"
                        onClick={() => markWatched(true)}
                      >
                        <CheckCheck />
                        Mark watched &amp; next
                      </Button>
                    )}

                    <Button
                      size="lg"
                      variant={nextEp ? "outline" : "default"}
                      onClick={() => markWatched(false)}
                    >
                      <Check />
                      Mark watched
                    </Button>
                  </>
                )}
              </div>
            </Card>

            {/* Previous / Next navigation */}
            <nav
              aria-label="Episodes"
              className="flex items-center justify-between gap-3"
            >
              {prevEp ? (
                <Button asChild variant="ghost" className="min-w-0">
                  <Link href={epHref(prevEp.id)}>
                    <ChevronLeft />
                    <span className="truncate">
                      Previous · {episodeLabel(anime, prevEp)}
                    </span>
                  </Link>
                </Button>
              ) : (
                <span />
              )}

              {nextEp && (
                <Button asChild variant="ghost" className="min-w-0">
                  <Link href={epHref(nextEp.id)}>
                    <span className="truncate">
                      Next · {episodeLabel(anime, nextEp)}
                    </span>
                    <ChevronRight />
                  </Link>
                </Button>
              )}
            </nav>
          </div>

          {/* Episode sidebar */}
          <aside
            aria-label={
              multiSeason
                ? `Season ${episode.seasonNumber} episodes`
                : "Episodes"
            }
            className="space-y-5 lg:pt-8"
          >
            {/* Current Episode Details Preview */}
            <div className="overflow-hidden rounded-xl bg-ink-raised/80 p-3.5 ring-1 ring-white/10 backdrop-blur">
              <div className="relative aspect-video overflow-hidden rounded-lg ring-1 ring-white/10">
                <img
                  src={episode.thumbnail}
                  alt={episode.title}
                  className={cn(
                    "h-full w-full object-cover",
                    watched && "opacity-60",
                  )}
                />

                <Badge className="absolute left-2.5 top-2.5 rounded-md bg-ink/80 text-xs font-bold tabular-nums text-white">
                  {episodeLabel(anime, episode)}
                </Badge>

                {watched && (
                  <span
                    className="absolute right-2.5 top-2.5 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground"
                    aria-label="Watched"
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                )}
              </div>

              <div className="mt-3">
                <p className="text-[12px] font-medium uppercase tracking-wide text-lagoon-200">
                  {multiSeason ? `Season ${episode.seasonNumber} · ` : ""}
                  Episode {episode.episodeNumber}
                </p>

                <h2
                  className="mt-1 text-balance text-base font-bold text-white leading-snug"
                  style={{
                    fontFamily: "var(--font-family-heading)",
                  }}
                >
                  {episode.title}
                </h2>

                <p className="mt-1.5 text-xs text-zinc-400">
                  {episode.duration} min
                </p>
              </div>
            </div>

            {/* Episode list */}
            <div>
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {multiSeason ? `Season ${episode.seasonNumber}` : "Episodes"} ·{" "}
                {seasonEpisodes.length}
              </p>

              <ol className="max-h-[380px] space-y-1 overflow-y-auto rounded-xl bg-white/[0.02] p-1.5 ring-1 ring-white/5 lg:max-h-[500px]">
              {seasonEpisodes.map((ep) => {
                const current = ep.id === episode.id;
                const done = episodeProgress(progress, ep) >= 100;

                return (
                  <li key={ep.id}>
                    <Link
                      href={epHref(ep.id)}
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/5",
                        current && "bg-primary/15 hover:bg-primary/20",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded text-xs font-semibold tabular-nums",
                          current
                            ? "bg-primary text-primary-foreground"
                            : done
                              ? "bg-primary/20 text-primary"
                              : "bg-white/5 text-zinc-400",
                        )}
                      >
                        {done && !current ? (
                          <Check className="size-3.5" strokeWidth={3} />
                        ) : (
                          ep.episodeNumber
                        )}
                      </span>

                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-[13px]",
                          current
                            ? "text-white"
                            : done
                              ? "text-zinc-500"
                              : "text-zinc-300",
                        )}
                      >
                        {ep.title}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>
        </div>
      </div>

      {/* Episode comments */}
      <CommentSection
        threadId={`episode:${episode.id}`}
        title={`${
          multiSeason ? `Season ${episode.seasonNumber} · ` : ""
        }Episode ${episode.episodeNumber} comments`}
        className="mx-auto w-[90%] max-w-3xl py-12"
      />
    </div>
  );
}
