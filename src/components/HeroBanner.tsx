"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { BookOpen, Info, Play, Star } from "lucide-react";
import { ResponsiveArt } from "@/components/ResponsiveArt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AnimeSummary, MangaSummary } from "@/data/schema";
import { episodeId } from "@/data/series";

export type HeroSlide = { kind: "anime"; item: AnimeSummary } | { kind: "manga"; item: MangaSummary };

const SLIDE_MS = 8000;

function slideMeta(slide: HeroSlide) {
  if (slide.kind === "anime") {
    const a = slide.item;
    return {
      parts: ["Anime", String(a.year), `${a.episodeCount} episodes`, a.studio],
      primary: { href: `/watch/${a.id}/${episodeId(a.id, 1, 1)}`, label: "Play episode 1", icon: Play },
      details: `/anime/${a.id}`,
    };
  }
  const m = slide.item;
  return {
    parts: ["Manga", `${m.chapterCount} chapters`, m.author],
    primary: m.firstChapterId
      ? { href: `/read/${m.id}/${m.firstChapterId}`, label: "Start reading", icon: BookOpen }
      : { href: `/manga/${m.id}`, label: "See chapters", icon: BookOpen },
    details: `/manga/${m.id}`,
  };
}

export function HeroBanner({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  // Parallax: artwork drifts slower than the page, copy lifts and fades, a dim settles in.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const artY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "28%"]);
  const artScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.08]);
  const copyY = useTransform(scrollYProgress, [0, 0.6], [0, reduce ? 0 : -72]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const dim = useTransform(scrollYProgress, [0, 1], [0, 0.75]);

  const next = () => setCurrent((c) => (c + 1) % slides.length);
  const slide = slides[current];
  if (!slide) return null;
  const meta = slideMeta(slide);
  const PrimaryIcon = meta.primary.icon;

  // One progress bar drives the timer: when its fill animation ends, the next slide shows.
  const progress = (active: boolean) => (
    <span className="absolute inset-0 overflow-hidden rounded-full bg-white/20">
      {active && (
        <span
          key={current}
          onAnimationEnd={next}
          className="hero-progress absolute inset-y-0 left-0 bg-lagoon-300"
          style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: paused ? "paused" : "running" }}
        />
      )}
    </span>
  );

  return (
    <section
      ref={ref}
      aria-roledescription="carousel"
      aria-label="Featured series"
      className="relative h-[100svh] min-h-[600px] overflow-hidden bg-ink"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <motion.div className="absolute inset-0 will-change-transform" style={{ y: artY, scale: artScale }}>
        {slides.map((s, i) => (
          <ResponsiveArt
            key={s.item.id}
            banner={s.item.bannerImage}
            cover={s.item.coverImage}
            aria-hidden
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out ${
              i === current ? "opacity-100" : "opacity-0"
            } ${i === current && !reduce ? "hero-kenburns" : ""}`}
            style={{ animationDuration: `${SLIDE_MS + 2000}ms` }}
          />
        ))}
      </motion.div>

      {/* Scrims only where text sits: top for the navbar, bottom-left for the copy. The art stays clear. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-ink/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-ink via-ink/45 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r from-ink/60 via-ink/10 to-transparent md:w-[62%]" />
      <motion.div className="pointer-events-none absolute inset-0 bg-ink" style={{ opacity: dim }} />

      <motion.div className="absolute inset-x-0 bottom-0" style={{ y: copyY, opacity: copyOpacity }}>
        <div className="mx-auto flex w-[90%] items-end justify-between gap-10 pb-[clamp(2.25rem,7vh,4.5rem)]">
          <div key={slide.item.id} className="hero-copy max-w-[32rem]" aria-live="polite">
            <h1
              className="text-balance text-white"
              style={{
                fontFamily: "var(--font-family-heading)",
                fontSize: "clamp(1.85rem, 3.4vw, 2.9rem)",
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              {slide.item.title}
            </h1>

            <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-zinc-300">
              <span className="inline-flex items-center gap-1 font-semibold text-white">
                <Star size={13} className="fill-coral-400 text-coral-400" />
                {slide.item.rating}
              </span>
              {meta.parts.map((p, i) => (
                <span key={p} className={`before:mr-2.5 before:text-white/30 before:content-['/'] ${i === meta.parts.length - 1 ? "hidden sm:inline" : ""}`}>
                  {p}
                </span>
              ))}
              <Badge
                variant="secondary"
                className={`rounded ${slide.item.status === "ONGOING" ? "bg-lagoon-400/20 text-lagoon-200" : "bg-white/10 text-zinc-300"}`}
              >
                {slide.item.status === "ONGOING" ? "Ongoing" : "Completed"}
              </Badge>
            </p>

            <p className="mt-3 line-clamp-2 text-[14.5px] leading-relaxed text-zinc-300">{slide.item.description}</p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Button asChild size="lg" className="font-semibold shadow-[0_8px_24px_-8px_rgba(46,196,182,0.6)]">
                <Link href={meta.primary.href}>
                  <PrimaryIcon className="fill-current" />
                  {meta.primary.label}
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="bg-white/12 font-semibold text-white hover:bg-white/20">
                <Link href={meta.details}>
                  <Info />
                  Details
                </Link>
              </Button>
            </div>

            {/* Phone: segmented progress instead of the poster strip. */}
            <div className="mt-6 flex gap-1.5 md:hidden">
              {slides.map((s, i) => (
                <button
                  key={s.item.id}
                  onClick={() => setCurrent(i)}
                  aria-label={`Show ${s.item.title}`}
                  aria-current={i === current}
                  className="relative h-1 w-7"
                >
                  {progress(i === current)}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden shrink-0 md:block">
            <p className="mb-2.5 text-right text-[12px] font-medium text-zinc-400">Up next</p>
            <div className="flex items-end gap-2.5">
              {slides.map((s, i) => {
                const active = i === current;
                return (
                  <button
                    key={s.item.id}
                    onClick={() => setCurrent(i)}
                    aria-label={`Show ${s.item.title}`}
                    aria-current={active}
                    className={`group relative w-[68px] text-left transition-all duration-500 ease-out lg:w-[82px] ${
                      active ? "-translate-y-1.5" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <span
                      className={`block aspect-[2/3] overflow-hidden rounded-md ring-1 transition-shadow ${
                        active ? "shadow-[0_12px_28px_-10px_rgba(0,0,0,0.8)] ring-lagoon-300" : "ring-white/15"
                      }`}
                    >
                      <img src={s.item.coverImage} alt="" className="h-full w-full object-cover" />
                    </span>
                    <span className="mt-1.5 block truncate text-[11px] text-zinc-300">
                      {s.kind === "anime" ? "Anime" : "Manga"}
                    </span>
                    <span className="relative mt-1 block h-0.5">{progress(active)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
