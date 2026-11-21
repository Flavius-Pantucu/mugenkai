"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ScheduleEntry } from "@/data/schema";
import { cn } from "@/lib/utils";

const PAGE = 6; // 3 rows × 2 columns on desktop
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function untilLabel(ms: number) {
  if (ms <= 0) return "Aired";
  const h = Math.round(ms / 3_600_000);
  return h < 1 ? "Soon" : h < 24 ? rtf.format(h, "hour") : rtf.format(Math.round(h / 24), "day");
}

/** This week's releases, Monday to Sunday in the viewer's time zone. */
export function WeeklySchedule({ entries }: { entries: ScheduleEntry[] }) {
  // Day boundaries depend on the viewer's time zone, which the server can't know: compute after mount.
  const [now, setNow] = useState<number | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [shown, setShown] = useState(PAGE);
  useEffect(() => setNow(Date.now()), []);

  const days = useMemo(() => {
    if (now === null) return null;
    const today = new Date(now);
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const start = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const end = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i + 1);
      const items = entries
        .filter((e) => e.airingAt * 1000 >= start.getTime() && e.airingAt * 1000 < end.getTime())
        .sort((a, b) => a.airingAt - b.airingAt || b.popularity - a.popularity);
      return { key: String(i), start, items, isToday: now >= start.getTime() && now < end.getTime() };
    });
  }, [now, entries]);

  const active = days?.find((d) => d.key === selected) ?? days?.find((d) => d.isToday) ?? days?.[0];

  // Nothing to show at all (e.g. upstream unreachable): leave the home page as it was.
  if (entries.length === 0) return null;

  return (
    <section className="mx-auto w-[90%]" aria-labelledby="schedule-title">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <h2 id="schedule-title" className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="text-white" style={{ fontFamily: "var(--font-family-heading)", fontSize: "clamp(1.05rem, 1.6vw, 1.3rem)", fontWeight: 700 }}>
            This week
          </span>
          <span className="text-[13px] font-normal text-muted-foreground">New episodes, in your time zone</span>
        </h2>
      </div>

      {!days || !active ? (
        <Skeleton className="h-48 w-full rounded-xl bg-white/[0.04]" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <ToggleGroup
            type="single"
            value={active.key}
            onValueChange={(v) => {
              if (!v) return;
              setSelected(v);
              setShown(PAGE);
            }}
            aria-label="Day of the week"
            className="scrollbar-hide grid w-full grid-cols-7 rounded-none border-b border-white/[0.06] p-1.5"
          >
            {days.map((d) => (
              <ToggleGroupItem
                key={d.key}
                value={d.key}
                aria-label={`${dayFmt.format(d.start)}, ${d.items.length} releases`}
                className="h-auto flex-col gap-0 rounded-md px-1 py-1 text-muted-foreground data-[state=on]:bg-primary/15 data-[state=on]:text-white sm:flex-row sm:gap-1.5"
              >
                <span className={cn("text-[11px] font-medium uppercase tracking-wide", d.isToday && "text-primary")}>
                  {d.isToday ? "Today" : dayFmt.format(d.start)}
                </span>
                <span className="text-sm font-bold tabular-nums">{d.start.getDate()}</span>
                <span className="hidden text-[11px] tabular-nums opacity-60 sm:inline">· {d.items.length}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {active.items.length === 0 ? (
            <p className="flex items-center gap-2 px-5 py-8 text-sm text-muted-foreground">
              <CalendarDays className="size-4" /> Nothing scheduled for this day.
            </p>
          ) : (
            <>
              <ul className="grid lg:grid-cols-2 lg:gap-x-4 lg:px-2 [&>li]:border-b [&>li]:border-white/[0.05]">
                {active.items.slice(0, shown).map((e) => (
                  <ScheduleRow key={e.id} entry={e} now={now!} />
                ))}
              </ul>
              {active.items.length > shown && (
                <div className="p-1 text-center">
                  <Button variant="ghost" size="sm" onClick={() => setShown((n) => n + PAGE)}>
                    <ChevronDown />
                    Show {Math.min(PAGE, active.items.length - shown)} more
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function ScheduleRow({ entry: e, now }: { entry: ScheduleEntry; now: number }) {
  const at = e.airingAt * 1000;
  const aired = at <= now;
  const body = (
    <>
      <span className={cn("w-11 shrink-0 text-[13px] font-semibold tabular-nums", aired ? "text-muted-foreground" : "text-white")}>{timeFmt.format(at)}</span>
      <img src={e.cover} alt="" loading="lazy" className={cn("h-10 w-7 shrink-0 rounded object-cover ring-1 ring-white/10", aired && "opacity-60")} />
      <span className="min-w-0 flex-1">
        <span className={cn("line-clamp-1 text-[13.5px] font-medium leading-snug", aired ? "text-zinc-400" : "text-white")}>{e.title}</span>
        <span className="block text-[11.5px] leading-tight text-muted-foreground">
          Episode {e.episode}
          {e.totalEpisodes ? ` of ${e.totalEpisodes}` : ""}
        </span>
      </span>
      {e.seriesId && (
        <Badge variant="outline" className="hidden border-primary/30 text-lagoon-200 sm:inline-flex">
          In library
        </Badge>
      )}
      <span className={cn("w-20 shrink-0 text-right text-[12px] tabular-nums", aired ? "text-muted-foreground" : "text-primary")}>{untilLabel(at - now)}</span>
    </>
  );
  return (
    <li>
      <Link href={`/anime/${e.seriesId ?? e.mediaId}`} className="flex items-center gap-3 px-3 py-1.5 transition-colors hover:bg-white/[0.04] focus-visible:bg-white/[0.04] focus-visible:outline-none">
        {body}
      </Link>
    </li>
  );
}
