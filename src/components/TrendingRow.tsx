"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TRENDING_WINDOWS, type Trending, type TrendingEntry, type TrendingWindow } from "@/data/schema";

const LABEL: Record<TrendingWindow, string> = { day: "Today", week: "This week", month: "This month" };
const isWindow = (v: string): v is TrendingWindow => (TRENDING_WINDOWS as readonly string[]).includes(v);

/** Top 10 anime by real AniList trend score, switchable between today, this week and this month. */
export function TrendingRow({ trending }: { trending: Trending }) {
  const [window, setWindow] = useState<TrendingWindow>("week");
  const available = TRENDING_WINDOWS.filter((w) => trending[w].length > 0);
  if (available.length === 0) return null;
  const current = trending[window].length > 0 ? window : available[0];
  const items = trending[current];

  return (
    // key: a new window starts the carousel at #1 again
    <Carousel key={current} opts={{ align: "start", slidesToScroll: "auto" }} className="mx-auto w-[90%]" aria-label="Trending anime">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h2 className="text-white" style={{ fontFamily: "var(--font-family-heading)", fontSize: "clamp(1.05rem, 1.6vw, 1.3rem)", fontWeight: 700 }}>
            Trending anime
          </h2>
          <ToggleGroup
            type="single"
            value={current}
            onValueChange={(v) => isWindow(v) && setWindow(v)}
            aria-label="Trending period"
            className="rounded-lg bg-white/[0.04] p-0.5"
          >
            {available.map((w) => (
              <ToggleGroupItem
                key={w}
                value={w}
                size="sm"
                className="h-7 rounded-md px-3 text-[12.5px] font-medium text-muted-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {LABEL[w]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="hidden items-center gap-1 sm:flex">
          <CarouselPrevious variant="ghost" className="static size-8 translate-y-0 disabled:opacity-30" />
          <CarouselNext variant="ghost" className="static size-8 translate-y-0 disabled:opacity-30" />
        </div>
      </div>

      <CarouselContent className="-ml-2 pb-1">
        {items.map((e, i) => (
          <CarouselItem key={e.key} className="basis-auto pl-2">
            <RankCard entry={e} rank={i + 1} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}

function RankCard({ entry: e, rank }: { entry: TrendingEntry; rank: number }) {
  const external = e.seriesId === null;
  const content = (
    <>
      {/* Outlined rank numeral sits behind the poster's left edge, Top-10 style. */}
      <span
        aria-hidden
        className="pointer-events-none -mr-2 select-none self-end text-[clamp(4.5rem,8vw,7rem)] font-black leading-[0.8] tracking-tighter text-transparent [-webkit-text-stroke:2px_rgba(255,255,255,0.35)] sm:-mr-3"
        style={{ fontFamily: "var(--font-family-heading)" }}
      >
        {rank}
      </span>
      <span className="relative block w-[30vw] shrink-0 sm:w-[clamp(118px,9.5vw,150px)]">
        <span className="relative block aspect-[2/3] overflow-hidden rounded-lg bg-ink-raised ring-1 ring-white/5 transition-transform duration-300 group-hover:-translate-y-1">
          <img src={e.cover} alt="" loading="lazy" className="h-full w-full object-cover" />
          <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
          {external && (
            <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-md bg-black/60 text-white/80 backdrop-blur-sm" title="Opens AniList">
              <ExternalLink className="size-3.5" />
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 p-2">
            <span className="line-clamp-2 text-[12.5px] font-semibold leading-tight text-white">{e.title}</span>
            <span className="mt-0.5 block truncate text-[10.5px] text-zinc-400">{e.meta}</span>
          </span>
        </span>
      </span>
    </>
  );
  const className = "group flex items-end rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const label = `#${rank} ${e.title}${external ? " (opens AniList)" : ""}`;
  return external ? (
    <a href={e.href} target="_blank" rel="noopener noreferrer" className={className} aria-label={label}>
      {content}
    </a>
  ) : (
    <Link href={e.href} className={className} aria-label={label}>
      {content}
    </Link>
  );
}
