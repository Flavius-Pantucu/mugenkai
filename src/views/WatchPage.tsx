"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, List, Maximize, Minimize, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { CommentSection } from "@/components/CommentSection";
import { animeList } from "@/data/mock-data";
import { getProgress, saveEpisodeProgress, WATCHED_AT } from "@/lib/progress";
import { NotFoundPage } from "./NotFoundPage";

const ctrl = "text-white/80 hover:bg-white/10 hover:text-white";

function formatTime(pct: number, totalMinutes: number) {
  const seconds = Math.floor((pct / 100) * totalMinutes * 60);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function WatchPage() {
  const { animeId, episodeId } = useParams<{ animeId: string; episodeId: string }>();
  const anime = animeList.find((a) => a.id === animeId);
  const episode = anime?.episodes.find((e) => e.id === episodeId);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  // New episode: resume where it was left (finished episodes start over).
  useEffect(() => {
    const saved = getProgress().episodes[episodeId]?.progress ?? 0;
    setProgress(saved >= WATCHED_AT ? 0 : saved);
    setIsPlaying(false);
  }, [episodeId]);

  // Save every 5s while playing, and once more on pause / leaving the episode.
  const progressRef = useRef(progress);
  progressRef.current = progress;
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => saveEpisodeProgress(episodeId, progressRef.current), 5000);
    return () => {
      clearInterval(id);
      saveEpisodeProgress(episodeId, progressRef.current);
    };
  }, [isPlaying, episodeId]);

  const pokeControls = useCallback(() => {
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    setShowControls(true);
    if (isPlaying) controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, [isPlaying]);

  useEffect(() => {
    pokeControls();
    return () => {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };
  }, [pokeControls]);

  // Simulated playback until real video sources exist.
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return p + 0.05;
      });
    }, 50);
    return () => clearInterval(id);
  }, [isPlaying]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  if (!anime || !episode) return <NotFoundPage />;

  const index = anime.episodes.findIndex((e) => e.id === episode.id);
  const prevEp = anime.episodes[index - 1];
  const nextEp = anime.episodes[index + 1];
  const epHref = (id: string) => `/watch/${anime.id}/${id}`;
  const seasonPrefix = (n: number) => (anime.seasons.length > 1 ? `Season ${n} · ` : "");

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) void playerRef.current?.requestFullscreen();
    else void document.exitFullscreen();
  };

  return (
    <div className="bg-black pt-16">
      <div className="flex min-h-[calc(100svh-4rem)] flex-col">
      <div
        ref={playerRef}
        className="relative flex flex-1 select-none items-center justify-center bg-black"
        onMouseMove={pokeControls}
        onClick={() => setIsPlaying((v) => !v)}
      >
        <img
          src={anime.bannerImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-500"
          style={{ filter: isPlaying ? "brightness(0.6)" : "brightness(0.4)" }}
        />

        {!isPlaying && (
          <span className="relative z-10 flex flex-col items-center gap-3">
            <span className="grid size-24 place-items-center rounded-full bg-primary/90 text-primary-foreground shadow-2xl">
              <Play className="ml-1 size-10 fill-current" />
            </span>
            {progress > 0 && progress < 100 && (
              <span className="rounded-full bg-black/60 px-3 py-1 text-sm text-white backdrop-blur-sm">
                Resume from {formatTime(progress, episode.duration)}
              </span>
            )}
          </span>
        )}

        <div
          className={cn("absolute inset-0 z-20 flex flex-col justify-between transition-opacity duration-300", showControls ? "opacity-100" : "pointer-events-none opacity-0")}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 bg-gradient-to-b from-black/80 to-transparent p-4">
            <Button asChild variant="ghost" size="icon" className={ctrl} aria-label={`Back to ${anime.title}`}>
              <Link href={`/anime/${anime.id}`}>
                <ChevronLeft className="size-6" />
              </Link>
            </Button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-white">{anime.title}</p>
              <p className="text-[13px] text-zinc-400">
                {seasonPrefix(episode.seasonNumber)}
                {episode.title}
              </p>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className={ctrl} aria-label="Episode list">
                  <List className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-80 border-white/10 bg-ink-raised/95 p-0 backdrop-blur-xl">
                <SheetHeader className="border-b border-white/10">
                  <SheetTitle>Episodes</SheetTitle>
                  <SheetDescription>{anime.episodes.length} total</SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-88px)]">
                  <div className="space-y-1 p-2">
                    {anime.episodes.map((ep, i) => {
                      const current = ep.id === episode.id;
                      const seasonStart = anime.seasons.length > 1 && ep.seasonNumber !== anime.episodes[i - 1]?.seasonNumber;
                      return (
                        <div key={ep.id}>
                        {seasonStart && (
                          <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Season {ep.seasonNumber}
                          </p>
                        )}
                        <Button
                          asChild
                          variant="ghost"
                          className={cn("h-auto w-full justify-start gap-3 p-3", current && "bg-primary/15 hover:bg-primary/20")}
                        >
                          <Link href={epHref(ep.id)} aria-current={current ? "page" : undefined}>
                            <span
                              className={cn(
                                "grid size-8 shrink-0 place-items-center rounded text-xs font-semibold",
                                current ? "bg-primary text-primary-foreground" : "bg-white/5 text-zinc-400",
                              )}
                            >
                              {ep.episodeNumber}
                            </span>
                            <span className="min-w-0 flex-1 text-left">
                              <span className={cn("block truncate text-[13px]", current ? "text-primary" : "text-zinc-300")}>{ep.title}</span>
                              <span className="block text-[11px] text-muted-foreground">{ep.duration} min</span>
                            </span>
                          </Link>
                        </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>

          <div className="space-y-3 bg-gradient-to-t from-black/80 to-transparent p-4">
            <Slider
              value={[progress]}
              max={100}
              step={0.1}
              onValueChange={([v]) => setProgress(v)}
              onValueCommit={([v]) => saveEpisodeProgress(episode.id, v)}
              aria-label="Seek"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {prevEp && (
                  <Button asChild variant="ghost" size="icon" className={ctrl} aria-label="Previous episode">
                    <Link href={epHref(prevEp.id)}>
                      <SkipBack className="size-5" />
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" size="icon" className={cn(ctrl, "size-11")} onClick={() => setIsPlaying((v) => !v)} aria-label={isPlaying ? "Pause" : "Play"}>
                  {isPlaying ? <Pause className="size-7" /> : <Play className="ml-0.5 size-7 fill-current" />}
                </Button>
                {nextEp && (
                  <Button asChild variant="ghost" size="icon" className={ctrl} aria-label="Next episode">
                    <Link href={epHref(nextEp.id)}>
                      <SkipForward className="size-5" />
                    </Link>
                  </Button>
                )}

                <Button variant="ghost" size="icon" className={ctrl} onClick={() => setMuted((v) => !v)} aria-label={muted ? "Unmute" : "Mute"}>
                  {muted || volume === 0 ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
                </Button>
                <Slider
                  value={[muted ? 0 : volume]}
                  max={100}
                  onValueChange={([v]) => {
                    setVolume(v);
                    setMuted(false);
                  }}
                  aria-label="Volume"
                  className="hidden w-24 sm:flex"
                />

                <span className="ml-3 hidden text-[13px] tabular-nums text-white/60 sm:block">
                  {formatTime(progress, episode.duration)} / {episode.duration}:00
                </span>
              </div>

              <Button variant="ghost" size="icon" className={ctrl} onClick={toggleFullscreen} aria-label={isFullscreen ? "Exit full screen" : "Full screen"}>
                {isFullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {nextEp && (
        <div className="flex items-center justify-between border-t border-white/10 bg-ink-raised p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Up next</p>
            <p className="text-sm font-medium text-white">
              {seasonPrefix(nextEp.seasonNumber)}
              {nextEp.title}
            </p>
          </div>
          <Button asChild>
            <Link href={epHref(nextEp.id)}>
              <Play className="fill-current" />
              Play next
            </Link>
          </Button>
        </div>
      )}
      </div>

      <div className="bg-ink">
        <CommentSection
          threadId={`episode:${episode.id}`}
          title={`${anime.seasons.length > 1 ? `Season ${episode.seasonNumber} · ` : ""}Episode ${episode.episodeNumber} comments`}
          className="mx-auto w-[90%] max-w-3xl py-12"
        />
      </div>
    </div>
  );
}
