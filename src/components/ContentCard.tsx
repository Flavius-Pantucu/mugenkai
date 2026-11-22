"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { BookOpen, Check, ChevronDown, Clock, Play, Plus, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { AnimeSummary, MangaSummary } from "@/data/schema";
import { episodeId, episodeLabel } from "@/data/series";
import { toggleList, useListStatus } from "@/lib/list";
import type { ReadingItem, WatchingItem } from "@/lib/progress";

type Series = { kind: "anime"; item: AnimeSummary } | { kind: "manga"; item: MangaSummary };

const OPEN_DELAY_MS = 450;
const PREVIEW_WIDTH_RATIO = 2; // preview is twice the card's width
const EDGE = 16; // keep the preview this far from the viewport edges
const NAV_HEIGHT = 72;

function seriesLinks(s: Series) {
  if (s.kind === "anime") {
    const a = s.item;
    return {
      details: `/anime/${a.id}`,
      primary: `/watch/${a.id}/${episodeId(a.id, 1, 1)}`,
      primaryLabel: `Play ${a.title}`,
      PrimaryIcon: Play,
      count:
        a.seasons.length > 1
          ? `${a.seasons.length} seasons`
          : `${a.episodeCount} ${a.episodeCount === 1 ? "episode" : "episodes"}`,
      by: a.studio,
      ongoingLabel: "Airing",
    };
  }
  const m = s.item;
  const isOngoing = m.status === "ONGOING";
  const count = typeof m.chapterCount === "number" && m.chapterCount > 0 ? m.chapterCount : null;
  return {
    details: `/manga/${m.id}`,
    primary: m.firstChapterId ? `/read/${m.id}/${m.firstChapterId}` : `/manga/${m.id}`,
    primaryLabel: `Read ${m.title}`,
    PrimaryIcon: BookOpen,
    count: isOngoing
      ? (count ? `${count} chs · Ongoing` : "Ongoing")
      : (count ? `${count} chapters` : "Completed"),
    by: m.author,
    ongoingLabel: "Ongoing",
  };
}

/** Poster that opens a larger preview over its neighbours after a short hover (pointer devices only). */
function PosterCard({ series, fluid }: { series: Series; fluid?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const { item } = series;
  const links = seriesLinks(series);

  const scheduleOpen = () => {
    if (!window.matchMedia("(hover: hover) and (min-width: 768px)").matches) return;
    timer.current = window.setTimeout(() => ref.current && setAnchor(ref.current.getBoundingClientRect()), OPEN_DELAY_MS);
  };
  const cancelOpen = () => window.clearTimeout(timer.current);
  useEffect(() => cancelOpen, []);

  return (
    <>
      <Link
        ref={ref}
        href={links.details}
        onMouseEnter={scheduleOpen}
        onMouseLeave={cancelOpen}
        className={cn(
          "group block shrink-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] transition-transform",
          fluid ? "w-full" : "w-[42vw] sm:w-[clamp(168px,15.2vw,232px)]",
        )}
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-ink-raised ring-1 ring-white/5">
          <img src={item.coverImage} alt="" loading="lazy" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

          <Badge className="absolute right-2 top-2 rounded-md bg-black/60 text-yellow-400 backdrop-blur-sm">
            <Star className="fill-current" />
            {item.rating.toFixed(1)}
          </Badge>
          {item.status === "ONGOING" && (
            <Badge className="absolute left-2 top-2 rounded-md uppercase tracking-wide">{links.ongoingLabel}</Badge>
          )}

          <div className="absolute inset-x-0 bottom-0 p-3">
            <p className="truncate text-[13px] font-semibold text-white" style={{ fontFamily: "var(--font-family-heading)" }}>
              {item.title}
            </p>
            <p className="truncate text-[11px] text-zinc-400">
              {series.kind === "anime" ? item.genres.slice(0, 2).join(" / ") : links.count}
            </p>
          </div>
        </div>
      </Link>

      <AnimatePresence>
        {anchor && <HoverPreview key="preview" series={series} anchor={anchor} onClose={() => setAnchor(null)} />}
      </AnimatePresence>
    </>
  );
}

function HoverPreview({ series, anchor, onClose }: { series: Series; anchor: DOMRect; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inList = useListStatus(series.item.id) !== undefined;
  const [top, setTop] = useState(anchor.top);
  const { item } = series;
  const links = seriesLinks(series);

  // Grow to the right; flip to grow left when that would leave the viewport.
  const viewport = document.documentElement.clientWidth;
  const width = Math.max(anchor.width * PREVIEW_WIDTH_RATIO, 340);
  const growLeft = anchor.left + width > viewport - EDGE;
  const left = growLeft ? Math.max(EDGE, anchor.right - width) : anchor.left;
  const startScale = anchor.width / width;

  // Centre on the card vertically, clamped below the navbar and above the viewport bottom.
  useLayoutEffect(() => {
    const h = ref.current?.offsetHeight ?? 0;
    const ideal = anchor.top + anchor.height / 2 - h / 2;
    setTop(Math.min(Math.max(ideal, NAV_HEIGHT), window.innerHeight - h - EDGE));
  }, [anchor]);

  // A fixed-position preview would drift from its card on scroll or resize; close instead.
  useEffect(() => {
    const opts = { passive: true } as const;
    window.addEventListener("scroll", onClose, opts);
    window.addEventListener("resize", onClose, opts);
    return () => {
      window.removeEventListener("scroll", onClose);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  const { PrimaryIcon } = links;

  return createPortal(
    <motion.div
      ref={ref}
      role="dialog"
      aria-label={item.title}
      onMouseLeave={onClose}
      initial={{ opacity: 0, scale: startScale }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: startScale, transition: { duration: 0.15 } }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "fixed", top, left, width, transformOrigin: growLeft ? "right center" : "left center" }}
      className="z-[60] overflow-hidden rounded-xl bg-ink-raised shadow-[0_30px_80px_-20px_rgba(0,0,0,0.95)] ring-1 ring-white/10"
    >
      <Link href={links.details} onClick={onClose} className="relative block aspect-video">
        <img src={item.bannerImage} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-raised via-ink-raised/10 to-transparent" />
        <p
          className="absolute inset-x-4 bottom-2 line-clamp-2 text-[19px] font-black leading-tight text-white"
          style={{ fontFamily: "var(--font-family-heading)" }}
        >
          {item.title}
        </p>
      </Link>

      <div className="space-y-3 p-4 pt-3">
        <div className="flex items-center gap-2">
          <Button asChild size="icon" className="rounded-full">
            <Link href={links.primary} onClick={onClose} aria-label={links.primaryLabel}>
              <PrimaryIcon className={series.kind === "anime" ? "fill-current" : ""} />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            aria-pressed={inList}
            aria-label={inList ? "Remove from your list" : "Add to your list"}
            onClick={() => toggleList(series.item.id)}
          >
            {inList ? <Check className="text-primary" /> : <Plus />}
          </Button>
          <Button asChild variant="outline" size="icon" className="ml-auto rounded-full">
            <Link href={links.details} onClick={onClose} aria-label={`More about ${item.title}`}>
              <ChevronDown />
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-zinc-300">
          <span className="inline-flex items-center gap-1 font-semibold text-white">
            <Star className="size-3.5 fill-coral-400 text-coral-400" />
            {item.rating.toFixed(1)}
          </span>
          <span>{item.year}</span>
          <span>{links.count}</span>
          <Badge variant={item.status === "ONGOING" ? "default" : "secondary"} className="rounded-md">
            {item.status === "ONGOING" ? links.ongoingLabel : "Completed"}
          </Badge>
        </div>

        <p className="line-clamp-3 text-[13px] leading-relaxed text-zinc-400">{item.description}</p>

        <p className="flex flex-wrap gap-x-2 text-[12.5px] text-zinc-200">
          {item.genres.slice(0, 4).map((g, i) => (
            <span key={g} className={i ? "before:mr-2 before:text-zinc-600 before:content-['•']" : ""}>
              {g}
            </span>
          ))}
        </p>
        <p className="text-[12px] text-muted-foreground">{links.by}</p>
      </div>
    </motion.div>,
    document.body,
  );
}

export function AnimeCard({ anime, fluid }: { anime: AnimeSummary; fluid?: boolean }) {
  return <PosterCard series={{ kind: "anime", item: anime }} fluid={fluid} />;
}

export function MangaCard({ manga, fluid }: { manga: MangaSummary; fluid?: boolean }) {
  return <PosterCard series={{ kind: "manga", item: manga }} fluid={fluid} />;
}

/** Wide resume card shared by continue watching and continue reading. */
function ResumeCard({ href, image, title, meta, progress, Icon }: { href: string; image: string; title: string; meta: string; progress: number; Icon: typeof Play }) {
  return (
    <Link
      href={href}
      className="group block w-[78vw] shrink-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-[clamp(280px,24vw,360px)] active:scale-[0.98] transition-transform"
    >
      <div className="relative aspect-video overflow-hidden rounded-xl bg-ink-raised ring-1 ring-white/5">
        <img src={image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg">
            <Icon className="ml-0.5 size-5 fill-current" />
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="truncate text-[13px] font-semibold text-white">{title}</p>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] text-zinc-400">
            <Clock className="size-2.5" />
            {meta}
          </p>
          <Progress value={progress} className="h-1 bg-white/15" />
        </div>
      </div>
    </Link>
  );
}

export function ContinueWatchingCard({ item }: { item: WatchingItem }) {
  const { anime, progress } = item;
  const label = episodeLabel(anime, item);
  const left = Math.max(1, Math.round(anime.episodeDuration * (1 - progress / 100)));
  return (
    <ResumeCard
      href={`/watch/${anime.id}/${item.episodeId}`}
      image={item.thumbnail}
      title={anime.title}
      meta={progress > 0 ? `${label} · ${left} min left` : `Up next · ${label}`}
      progress={progress}
      Icon={Play}
    />
  );
}

export function ContinueReadingCard({ item }: { item: ReadingItem }) {
  const { manga, page, pageCount, chapterNumber } = item;
  const finished = page >= pageCount;
  return (
    <ResumeCard
      // A finished chapter resumes from the manga page, whose Continue button picks the next chapter.
      href={finished ? `/manga/${manga.id}` : `/read/${manga.id}/${item.chapterId}`}
      image={manga.bannerImage}
      title={manga.title}
      meta={finished ? `Read Ch. ${chapterNumber} · continue` : `Ch. ${chapterNumber} · page ${page} of ${pageCount}`}
      progress={(page / pageCount) * 100}
      Icon={BookOpen}
    />
  );
}
