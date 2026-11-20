"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, Check, CheckCheck, ChevronDown, EyeOff, Play, Plus, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { LIST_STATUSES, type ListStatus, type Status } from "@/data/schema";
import { listLabel, setListStatus, useListStatus } from "@/lib/list";
import { markFinished } from "@/lib/progress";
import { CommentSection } from "./CommentSection";
import { ResponsiveArt } from "./ResponsiveArt";
import { Footer } from "./Footer";

/** One episode or chapter, normalized so anime and manga share the page. */
export interface SeriesUnit {
  id: string;
  number: number;
  label: string; // "E7", "S2 E7" or "Ch. 12"
  title: string;
  image: string;
  href: string;
  length: string; // "24 min" or "18 pages"
  pageCount?: number; // chapters only
  remaining?: string; // "13 min left", shown when partly done
  progress: number; // 0-100
  isNew: boolean;
}

/** A season or a volume. */
export interface SeriesGroup {
  id: string;
  title: string; // "Season 2", "Volume 4"
  subtitle?: string; // the season's own name
  year?: number;
  cover: string;
  range: string; // "Episodes 1–12" or "Chapters 1–10"
  units: SeriesUnit[];
}

export interface SeriesPageProps {
  kind: "anime" | "manga";
  title: string;
  banner: string; // wide art, md and up
  cover: string; // portrait art, phones
  rating: number;
  status: Status;
  facts: string[]; // year, counts, studio or author
  genres: string[];
  description: string;
  groups: SeriesGroup[];
  showProgress: boolean;
  seriesId: string;
  threadId: string; // comment thread for the whole series, e.g. "anime:16498"
  related: React.ReactNode;
}

const NOUN = {
  anime: { unit: "episode", units: "episodes", done: "watched", start: "Play episode 1", group: "Season" },
  manga: { unit: "chapter", units: "chapters", done: "read", start: "Read chapter 1", group: "Volume" },
};

const PAGE = 12; // episodes or chapters shown per "Show more"

export function SeriesPage(props: SeriesPageProps) {
  const { kind, groups, showProgress } = props;
  const noun = NOUN[kind];

  // Resume point: the furthest unit with progress; once it's finished, the one after it.
  const all = groups.flatMap((g) => g.units);
  const furthest = showProgress ? all.findLastIndex((u) => u.progress > 0) : -1;
  const resume = furthest < 0 ? undefined : all[furthest].progress < 100 ? all[furthest] : all[furthest + 1];
  const resumeGroup = resume ? groups.find((g) => g.units.includes(resume)) : undefined;

  const [activeId, setActiveId] = useState(resumeGroup?.id ?? groups[0]?.id ?? "");
  const [newestFirst, setNewestFirst] = useState(false);
  const [hideDone, setHideDone] = useState(false);
  const listStatus = useListStatus(props.seriesId);
  const [shown, setShown] = useState(PAGE);

  // Saved progress arrives after hydration: jump to the resume season/volume once, the first time it's known.
  const jumped = useRef(false);
  const resumeGroupId = resumeGroup?.id;
  useEffect(() => {
    if (jumped.current || !resumeGroupId) return;
    jumped.current = true;
    setActiveId(resumeGroupId);
  }, [resumeGroupId]);

  const active = groups.find((g) => g.id === activeId) ?? groups[0];

  const units = useMemo(() => {
    let list = active ? [...active.units] : [];
    if (hideDone && showProgress) list = list.filter((u) => u.progress < 100);
    return newestFirst ? list.reverse() : list;
  }, [active, hideDone, newestFirst, showProgress]);

  // New season or order: start from one page, but far enough to show where the user stopped.
  useEffect(() => {
    const at = resume ? units.findIndex((u) => u.id === resume.id) : -1;
    setShown(Math.max(PAGE, Math.ceil((at + 1) / PAGE) * PAGE));
  }, [activeId, newestFirst, hideDone, resume?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const groupLabel = (g: SeriesGroup) => {
    const done = g.units.filter((u) => u.progress >= 100).length;
    return showProgress && done > 0 ? `${done} of ${g.units.length} ${noun.done}` : `${g.units.length} ${noun.units}`;
  };

  const primary = resume
    ? { href: resume.href, label: `Continue ${resume.label}` }
    : all[0] && { href: all[0].href, label: noun.start };
  const PrimaryIcon = kind === "anime" ? Play : BookOpen;
  const left = units.length - shown;
  const unfinished = active?.units.filter((u) => u.progress < 100) ?? [];

  const markGroupDone = () => {
    if (!active) return;
    if (kind === "anime") markFinished(unfinished.map((u) => u.id), []);
    else markFinished([], unfinished.map((u) => ({ id: u.id, pageCount: u.pageCount ?? 1 })));
    toast.success(`${active.title} marked ${noun.done}`);
  };

  return (
    <div className="min-h-screen bg-ink">
      {/* Banner: the art stays visible; scrims only under the text. */}
      <header className="relative flex min-h-[440px] items-end overflow-hidden sm:min-h-[460px]">
        <ResponsiveArt banner={props.banner} cover={props.cover} aria-hidden className="absolute inset-0 h-full w-full object-cover object-top md:object-center" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink/70 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r from-ink/70 via-ink/20 to-transparent md:w-2/3" />

        <div className="relative mx-auto w-[90%] pb-8 pt-28">
          <h1
            className="max-w-3xl text-balance text-white"
            style={{ fontFamily: "var(--font-family-heading)", fontSize: "clamp(2rem, 3.8vw, 3.1rem)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.02em" }}
          >
            {props.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-zinc-300">
            <span className="inline-flex items-center gap-1 font-semibold text-white">
              <Star className="size-3.5 fill-coral-400 text-coral-400" />
              {props.rating.toFixed(1)}
            </span>
            {props.facts.map((f) => (
              <span key={f} className="before:mr-2.5 before:text-white/30 before:content-['/']">
                {f}
              </span>
            ))}
            <Badge variant={props.status === "ONGOING" ? "default" : "secondary"} className="rounded">
              {props.status === "ONGOING" ? "Ongoing" : "Completed"}
            </Badge>
          </div>

          <p className="mt-3 line-clamp-3 max-w-2xl text-[14.5px] leading-relaxed text-zinc-300">{props.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {props.genres.map((g) => (
              <Badge key={g} variant="outline" className="border-white/15 text-zinc-300">
                {g}
              </Badge>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            {primary && (
              <Button asChild size="lg" className="font-semibold shadow-[0_8px_24px_-8px_rgba(46,196,182,0.6)]">
                <Link href={primary.href}>
                  <PrimaryIcon className={kind === "anime" ? "fill-current" : ""} />
                  {primary.label}
                </Link>
              </Button>
            )}
            <ListStatusMenu kind={kind} seriesId={props.seriesId} status={listStatus} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-[90%] pb-20">
        {/* Toolbar: pick a season or volume, then order / filter what it contains. */}
        <div className="mt-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 sm:mt-10">
          <div>
            {groups.length > 1 ? (
              <Select value={active?.id} onValueChange={setActiveId}>
                <SelectTrigger aria-label={noun.group} className="min-w-[220px] bg-ink-raised text-base font-bold text-white data-[size=default]:h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.title}
                      <span className="text-xs font-normal text-muted-foreground">{groupLabel(g)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <h2 className="text-white" style={{ fontFamily: "var(--font-family-heading)", fontSize: "clamp(1.15rem, 1.8vw, 1.4rem)", fontWeight: 700 }}>
                {active?.title}
              </h2>
            )}
            <p className="mt-2 text-[13px] text-muted-foreground">
              {[active?.subtitle !== props.title && active?.subtitle, active?.year, active && `${active.units.length} ${noun.units}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {showProgress && unfinished.length > 0 && (
              <Button variant="outline" onClick={markGroupDone}>
                <CheckCheck />
                Mark {groups.length > 1 ? noun.group.toLowerCase() : "all"} {noun.done}
              </Button>
            )}
            <Select value={newestFirst ? "newest" : "oldest"} onValueChange={(v) => setNewestFirst(v === "newest")}>
              <SelectTrigger aria-label="Order" className="w-[140px] bg-ink-raised">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="newest">Newest first</SelectItem>
              </SelectContent>
            </Select>
            {showProgress && (
              <Toggle variant="outline" pressed={hideDone} onPressedChange={setHideDone} className="data-[state=on]:bg-lagoon-400/15 data-[state=on]:text-lagoon-200">
                <EyeOff />
                Hide {noun.done}
              </Toggle>
            )}
          </div>
        </div>

        <div id="series-units" className="mt-5">
          {units.length === 0 ? (
            <Card className="bg-transparent text-center">
              <CardContent className="py-8">
                <p className="text-[15px] text-zinc-200">
                  You have {noun.done} every {noun.unit} in {active?.title}.
                </p>
                <Button variant="link" onClick={() => setHideDone(false)} className="mt-2">
                  Show {noun.done} {noun.units}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
                {units.slice(0, shown).map((u) => (
                  <li key={u.id}>
                    <UnitCard unit={u} showProgress={showProgress} current={u.id === resume?.id} doneWord={noun.done} />
                  </li>
                ))}
              </ul>
              {(left > 0 || shown > PAGE) && (
                <div className="mt-8 flex justify-center gap-2">
                  {left > 0 && (
                    <Button variant="outline" size="lg" onClick={() => setShown((s) => s + PAGE)}>
                      <ChevronDown />
                      Show {Math.min(PAGE, left)} more
                      <span className="text-muted-foreground">· {left} left</span>
                    </Button>
                  )}
                  {shown > PAGE && (
                    <Button variant="ghost" size="lg" onClick={() => setShown(PAGE)}>
                      Show less
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <CommentSection threadId={props.threadId} className="mt-16 max-w-3xl" />
      </main>

      {/* Outside <main>: ContentRow sets its own 90% width. */}
      <div className="mt-4 pb-4">{props.related}</div>

      <Footer />
    </div>
  );
}

/** "Add to list" when the title isn't saved; otherwise its status, changeable from the menu. */
function ListStatusMenu({ kind, seriesId, status }: { kind: "anime" | "manga"; seriesId: string; status: ListStatus | undefined }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="lg" variant="secondary" className="bg-white/12 font-semibold text-white hover:bg-white/20">
          {status ? <Check className="text-primary" /> : <Plus />}
          {status ? listLabel(status, kind) : "Add to list"}
          <ChevronDown className="opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuRadioGroup value={status ?? ""} onValueChange={(v) => setListStatus(seriesId, v as ListStatus)}>
          {LIST_STATUSES.map((s) => (
            <DropdownMenuRadioItem key={s} value={s}>
              {listLabel(s, kind)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {status && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setListStatus(seriesId, null)}>
              <X />
              Remove from list
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UnitCard({ unit, showProgress, current, doneWord }: { unit: SeriesUnit; showProgress: boolean; current: boolean; doneWord: string }) {
  const done = showProgress && unit.progress >= 100;
  const partial = showProgress && unit.progress > 0 && unit.progress < 100;
  return (
    <Link href={unit.href} className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background">
      <span
        className={cn(
          "relative block aspect-video overflow-hidden rounded-lg ring-1 transition-shadow",
          current ? "ring-2 ring-primary" : "ring-white/10 group-hover:ring-white/30",
        )}
      >
        <img
          src={unit.image}
          alt=""
          loading="lazy"
          className={cn("h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]", done && "opacity-55")}
        />
        <Badge className="absolute left-2 top-2 rounded-md bg-ink/80 font-bold tabular-nums text-white">{unit.label}</Badge>
        {unit.isNew && <Badge className="absolute right-2 top-2 rounded-md bg-coral-400 font-bold text-ink">New</Badge>}
        {done && (
          <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground" aria-label={doneWord}>
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        )}
        {partial && <Progress value={unit.progress} className="absolute inset-x-0 bottom-0 h-1 rounded-none bg-white/20" />}
      </span>
      <span className={cn("mt-2.5 block truncate text-[14px] font-bold", current ? "text-lagoon-200" : "text-white")}>{unit.title}</span>
      <span className="mt-0.5 block text-[12.5px] tabular-nums text-muted-foreground">
        {unit.length}
        {partial && unit.remaining ? ` · ${unit.remaining}` : ""}
        {done ? ` · ${doneWord[0].toUpperCase()}${doneWord.slice(1)}` : ""}
      </span>
    </Link>
  );
}
