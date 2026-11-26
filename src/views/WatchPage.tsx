"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import {
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Radio,
  RotateCcw,
  Server,
  Share2,
  SkipForward,
  Sparkles,
  Tv,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CommentSection } from "@/components/CommentSection";

import type { Anime } from "@/data/schema";
import type { FranchiseSeason } from "@/server/details";
import { episodeLabel } from "@/data/series";
import {
  episodeProgress,
  getProgress,
  saveEpisodeProgress,
  useProgress,
  WATCHED_AT,
} from "@/lib/progress";
import { createLocalStore } from "@/lib/local-store";

import { NotFoundPage } from "./NotFoundPage";

const SERVERS = [
  { id: "yuri", label: "Yuri (Multi-Sub)", tip: "Soft subtitles in several languages" },
  { id: "sora", label: "Sora (Fast HD)", tip: "Ultra-fast stream, high quality" },
  { id: "flow", label: "Flow (HD-1)", tip: "Fastest stream, OP/ED auto-skip" },
  { id: "kitty", label: "Kitty (HD-2)", tip: "Backup mirror for Flow" },
  { id: "buzz", label: "Buzz (HD-3)", tip: "Extra backup server" },
  { id: "zuri", label: "Zuri (Raw/Sub)", tip: "Japanese audio fallback" },
] as const;

type ServerId = (typeof SERVERS)[number]["id"];

// Player choices carry over between episodes and visits on this device.
const PrefsSchema = z.object({ audio: z.enum(["sub", "dub"]), autoSkip: z.boolean(), autoNext: z.boolean() });
const prefsStore = createLocalStore("mugenkai:watch-prefs", PrefsSchema, { audio: "sub", autoSkip: true, autoNext: true });
const setPref = (p: Partial<z.infer<typeof PrefsSchema>>) => prefsStore.write((cur) => ({ ...cur, ...p }));
const AUTO_NEXT_SECONDS = 8;

/**
 * Episodes are embedded through AniFlow's multi-source engine.
 * Supports 6 streaming backends (Yuri, Sora, Flow, Kitty, Buzz, Zuri),
 * Sub/Dub switching, auto-skip intro/outro, and automated progress tracking.
 */
export function WatchPage({
  anime,
  episodeId,
  franchiseSeasons,
}: {
  anime: Anime;
  episodeId: string;
  franchiseSeasons?: FranchiseSeason[];
}) {
  const router = useRouter();
  const progress = useProgress();

  const [server, setServer] = useState<ServerId>("yuri");
  // What the player reports it is actually playing; it can switch servers on its own (menu or failover).
  const [playing, setPlaying] = useState<ServerId | null>(null);
  const [reloads, setReloads] = useState(0);
  const { audio, autoSkip, autoNext } = prefsStore.useValue();
  const setAudio = (a: "sub" | "dub") => setPref({ audio: a });
  const searchParams = useSearchParams();
  // Where playback starts: a shared ?t= link, else where this episode was left. Resolved after
  // hydration (saved progress isn't known on the server), and only once per episode: changing the
  // iframe URL afterwards would restart the stream.
  const [startAt, setStartAt] = useState<number | null>(null);
  const currentTime = useRef(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  const episode = anime.episodes.find((e) => e.id === episodeId);

  useEffect(() => {
    if (!episode) return;
    const shared = Number(searchParams.get("t"));
    const saved = getProgress().episodes[episode.id]?.progress ?? 0;
    setStartAt(shared > 0 ? shared : saved > 2 && saved < WATCHED_AT ? Math.round((saved / 100) * episode.duration * 60) : 0);
    setCountdown(null);
    currentTime.current = 0;
  }, [episode?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-next: count down after the episode ends; Cancel or leaving the page stops it.
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      const next = episode && anime.episodes[anime.episodes.indexOf(episode) + 1];
      if (next) router.push(`/watch/${anime.id}/${next.id}`);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const currentSeasonId = season?.id ?? anime.id;

  const watchSeasonOptions = useMemo(() => {
    const opts: Array<{
      id: string;
      title: string;
      isExternal: boolean;
      externalId?: string;
      seasonNumber?: number;
    }> = anime.seasons.map((s) => ({
      id: s.id,
      title: `Season ${s.number}${s.title && s.title !== anime.title ? ` · ${s.title}` : ""}`,
      isExternal: false,
      seasonNumber: s.number,
    }));

    if (franchiseSeasons && franchiseSeasons.length > 0) {
      for (const fs of franchiseSeasons) {
        const isRepresented = opts.some(
          (o) => o.id === fs.id || (o.seasonNumber !== undefined && o.seasonNumber === fs.number),
        );
        if (!isRepresented) {
          opts.push({
            id: fs.id,
            title: `Season ${fs.number} · ${fs.title}`,
            isExternal: true,
            externalId: fs.id,
          });
        }
      }
    }

    return opts;
  }, [anime.seasons, anime.title, franchiseSeasons]);

  // Sync audio with server (zuri is sub-only)
  const handleAudioChange = (newAudio: "sub" | "dub") => {
    setPlaying(null);
    setAudio(newAudio);
    if (newAudio === "dub" && (server === "zuri" || server === "sora")) {
      setServer("yuri");
    }
  };

  // Embedded through the local AniFlow embed route
  const streamUrl =
    season && startAt !== null
      ? `/embed/ani/${season.id}/${episode.episodeNumber}/${audio}?server=${server}&autoskipIntro=${autoSkip ? 1 : 0}&autoskipOutro=${autoSkip ? 1 : 0}&startAt=${startAt}`
      : null;

  const share = async () => {
    const t = Math.floor(currentTime.current);
    const url = `${window.location.origin}/watch/${anime.id}/${episode.id}${t > 0 ? `?t=${t}` : ""}`;
    const at = t > 0 ? ` at ${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}` : "";
    try {
      if (navigator.share) await navigator.share({ title: `${anime.title} · ${episodeLabel(anime, episode)}`, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success(`Link copied${at}`);
      }
    } catch {
      // share sheet dismissed
    }
  };

  // Listen for playback progress from AniFlow's postMessage bridge
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg?.source !== "aniembed") return;

      // Player's episode controls: send it the season list, follow its picks (own iframe only).
      if (event.origin !== window.location.origin) return;
      if (msg.name === "episodes-request") {
        const item = (e: typeof episode) => ({
          id: e.id,
          label: episodeLabel(anime, e),
          title: e.title,
          watched: episodeProgress(progress, e) >= 100,
          current: e.id === episode.id,
        });
        (event.source as Window | null)?.postMessage(
          { name: "episodes", data: { next: nextEp ? item(nextEp) : null, list: seasonEpisodes.map(item) } },
          window.location.origin,
        );
        return;
      }
      if (msg.name === "navigate") {
        const target = anime.episodes.find((e) => e.id === msg.data?.episodeId);
        if (target) router.push(epHref(target.id));
        return;
      }

      if (msg.name === "PLAYER_EVENT" && (msg.data?.type === "ready" || msg.data?.type === "source_change")) {
        const reported = SERVERS.find((s) => s.id === msg.data.server);
        if (reported) setPlaying(reported.id);
        return;
      }

      // The player reports `percentage` (0-100) and `currentTime` (seconds) every few seconds.
      if (msg.name === "progress" && typeof msg.data?.percentage === "number") {
        if (typeof msg.data.currentTime === "number") currentTime.current = msg.data.currentTime;
        const p = Math.round(msg.data.percentage);
        if (p > 0) {
          saveEpisodeProgress(episode.id, p);
        }
      } else if (msg.name === "ended") {
        saveEpisodeProgress(episode.id, 100);
        if (nextEp && prefsStore.read().autoNext) setCountdown(AUTO_NEXT_SECONDS);
        else toast.success(`${episodeLabel(anime, episode)} finished!`);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [episode.id, anime, episode, nextEp, progress]); // eslint-disable-line react-hooks/exhaustive-deps

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

        <div className="relative mx-auto grid w-[90%] grid-cols-[minmax(0,1fr)] gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-12">
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
                    key={`${streamUrl}#${reloads}`}
                    src={streamUrl}
                    title={`${anime.title} - Episode ${episode.episodeNumber}`}
                    className="absolute inset-0 h-full w-full border-0"
                    allowFullScreen
                    allow="autoplay; fullscreen; picture-in-picture"
                    scrolling="no"
                  />
                ) : season ? null : (
                  <div className="flex h-full items-center justify-center p-6 text-center text-sm text-zinc-400">
                    Could not find this episode's season. Check the season data
                    in your catalog.
                  </div>
                )}
                {countdown !== null && nextEp && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-ink/85 p-6 text-center backdrop-blur-sm">
                    <p className="text-sm text-zinc-300">Up next in {countdown}s</p>
                    <p className="text-lg font-bold text-white">
                      {episodeLabel(anime, nextEp)} · {nextEp.title}
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={() => setCountdown(0)}>
                        <SkipForward />
                        Play now
                      </Button>
                      <Button variant="outline" onClick={() => setCountdown(null)}>
                        Cancel
                      </Button>
                    </div>
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
                      const isSelected = (playing ?? server) === s.id;
                      const isDubDisabled = audio === "dub" && s.id === "zuri";
                      return (
                        <button
                          key={s.id}
                          type="button"
                          disabled={isDubDisabled}
                          onClick={() => {
                            if (isSelected) return;
                            setPlaying(null);
                            // Same URL as before (player had switched away on its own): force a reload.
                            if (s.id === server) setReloads((n) => n + 1);
                            else setServer(s.id);
                          }}
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
                      onClick={() => setPref({ autoSkip: !autoSkip })}
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

                    <button
                      type="button"
                      onClick={() => setPref({ autoNext: !autoNext })}
                      aria-pressed={autoNext}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition-colors ring-1 ring-white/10 cursor-pointer",
                        autoNext ? "bg-primary/15 text-primary ring-primary/30" : "bg-black/40 text-zinc-400 hover:text-white",
                      )}
                      title="Play the next episode when this one ends"
                    >
                      <SkipForward className="size-3.5" />
                      Auto-Next: {autoNext ? "ON" : "OFF"}
                    </button>

                    <button
                      type="button"
                      onClick={share}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-black/40 px-2.5 py-1.5 font-medium text-zinc-400 ring-1 ring-white/10 transition-colors hover:text-white cursor-pointer"
                      title="Share a link that starts at the current moment"
                    >
                      <Share2 className="size-3.5" />
                      Share
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
              {watchSeasonOptions.length > 1 && (
                <div className="mb-3 flex items-center justify-between gap-2 px-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Season
                  </span>
                  <Select
                    value={currentSeasonId}
                    onValueChange={(selectedId) => {
                      if (selectedId === currentSeasonId) return;
                      const opt = watchSeasonOptions.find((o) => o.id === selectedId);
                      if (opt?.isExternal && opt.externalId) {
                        router.push(`/watch/${opt.externalId}/${opt.externalId}-s1-e1`);
                      } else if (opt?.seasonNumber) {
                        const targetEp = anime.episodes.find((e) => e.seasonNumber === opt.seasonNumber);
                        if (targetEp) {
                          router.push(`/watch/${anime.id}/${targetEp.id}`);
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 min-w-[170px] max-w-[260px] border-white/10 bg-white/5 text-xs font-semibold text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-80 border-white/10 bg-ink-raised text-white">
                      {watchSeasonOptions.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">
                          {s.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
        className="mx-auto w-[90%] py-12"
      />
    </div>
  );
}
