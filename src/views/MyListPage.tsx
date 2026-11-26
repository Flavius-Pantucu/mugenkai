"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, BookOpen, Bookmark, Newspaper, Play, Search, Star, Trash2, Tv } from "lucide-react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ListStatus } from "@/data/schema";
import { cn } from "@/lib/utils";
import type { MyListData } from "@/server/my-list";

const STATUS_LABELS: Record<ListStatus, string> = {
  CURRENT: "Watching / Reading",
  PLANNING: "Planning",
  COMPLETED: "Completed",
  PAUSED: "Paused",
  DROPPED: "Dropped",
};

type SortKey = "updated" | "score" | "title" | "progress";

export function MyListPage({ data, signedIn }: { data: MyListData | null; signedIn: boolean }) {
  const [items, setItems] = useState(data?.items ?? []);
  const [kind, setKind] = useState<"ALL" | "ANIME" | "MANGA">("ALL");
  const [status, setStatus] = useState<"ALL" | ListStatus>("ALL");
  const [sort, setSort] = useState<SortKey>("updated");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter(
      (it) =>
        (kind === "ALL" || it.kind === kind) &&
        (status === "ALL" || it.listStatus === status) &&
        (!q || it.title.toLowerCase().includes(q)),
    );
    return [...list].sort((a, b) => {
      if (sort === "score") return (b.score ?? -1) - (a.score ?? -1);
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "progress") return b.progressCount - a.progressCount;
      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    });
  }, [items, kind, status, sort, query]);

  const updateEntry = async (seriesId: string, patch: { status?: ListStatus; score?: number | null }) => {
    const prev = items;
    setItems((cur) =>
      cur.map((x) =>
        x.seriesId === seriesId
          ? { ...x, ...(patch.status !== undefined ? { listStatus: patch.status } : {}), ...(patch.score !== undefined ? { score: patch.score } : {}) }
          : x,
      ),
    );
    try {
      const target = items.find((x) => x.seriesId === seriesId);
      const res = await fetch(`/api/list/${seriesId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: patch.status ?? target?.listStatus ?? "PLANNING",
          score: patch.score !== undefined ? patch.score : target?.score ?? null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("List updated");
    } catch {
      setItems(prev);
      toast.error("Couldn't update entry");
    }
  };

  const removeItem = async (seriesId: string) => {
    const prev = items;
    setItems((cur) => cur.filter((x) => x.seriesId !== seriesId));
    try {
      const res = await fetch(`/api/list/${seriesId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Removed from My List");
    } catch {
      setItems(prev);
      toast.error("Couldn't remove item");
    }
  };

  if (!signedIn || !data) {
    return (
      <div className="min-h-screen bg-ink pt-24">
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <Bookmark className="mx-auto size-10 text-lagoon-300" />
          <h1 className="mt-4 text-2xl font-bold text-white">Your Personal List &amp; News</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in to view your saved anime and manga, track progress, and follow upcoming episodes and chapter releases.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink pt-24">
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">My List</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {items.length} saved {items.length === 1 ? "title" : "titles"} · Live release updates for your library
            </p>
          </div>
        </header>

        {/* Stats Summary Bar */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatPill label="Saved" value={String(items.length)} />
          <StatPill label="Active" value={String(items.filter((i) => i.listStatus === "CURRENT").length)} />
          <StatPill label="Completed" value={String(items.filter((i) => i.listStatus === "COMPLETED").length)} />
          <StatPill label="Episodes Watched" value={String(data.stats.episodesWatched)} />
          <StatPill label="Chapters Read" value={String(data.stats.chaptersRead)} />
          <StatPill label="Mean Score" value={data.stats.meanScore ? `${data.stats.meanScore} / 10` : "—"} />
        </div>

        {/* Filter & Sort Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-56">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter saved titles…" className="h-9 pl-8" />
            </div>
            <ToggleGroup type="single" value={kind} onValueChange={(v) => v && setKind(v as typeof kind)} variant="outline" size="sm">
              <ToggleGroupItem value="ALL">All</ToggleGroupItem>
              <ToggleGroupItem value="ANIME">Anime</ToggleGroupItem>
              <ToggleGroupItem value="MANGA">Manga</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="w-44" aria-label="Filter by status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {Object.entries(STATUS_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-44" aria-label="Sort list">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Recently updated</SelectItem>
                <SelectItem value="score">Highest score</SelectItem>
                <SelectItem value="progress">Most progress</SelectItem>
                <SelectItem value="title">Title A–Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Saved Titles */}
          <section className="space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded-xl bg-ink-raised/60 p-10 text-center ring-1 ring-white/[0.06]">
                <p className="text-sm text-zinc-400">
                  {items.length === 0
                    ? "You haven't saved any anime or manga yet. Browse the catalog and click Add to list!"
                    : "No saved titles match that filter."}
                </p>
                {items.length === 0 && (
                  <div className="mt-4 flex justify-center gap-3">
                    <Button asChild size="sm">
                      <Link href="/anime">Browse Anime</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/manga">Browse Manga</Link>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filtered.map((item) => {
                  const pct = item.totalCount > 0 ? Math.min(100, Math.round((item.progressCount / item.totalCount) * 100)) : 0;
                  return (
                    <div
                      key={item.seriesId}
                      className="flex gap-3.5 rounded-xl bg-ink-raised/60 p-3.5 ring-1 ring-white/[0.06] transition-colors hover:bg-ink-raised"
                    >
                      <Link href={`/${item.kind.toLowerCase()}/${item.seriesId}`} className="shrink-0">
                        <img src={item.coverImage} alt={item.title} className="h-32 w-22 rounded-lg object-cover bg-white/5" />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/${item.kind.toLowerCase()}/${item.seriesId}`}
                              className="line-clamp-1 font-medium text-white hover:text-lagoon-300"
                            >
                              {item.title}
                            </Link>
                            <button
                              type="button"
                              onClick={() => removeItem(item.seriesId)}
                              aria-label={`Remove ${item.title}`}
                              className="shrink-0 rounded p-1 text-zinc-500 hover:bg-white/5 hover:text-red-400"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                            <span className="inline-flex items-center gap-1">
                              {item.kind === "ANIME" ? <Tv className="size-3" /> : <BookOpen className="size-3" />}
                              {item.kind}
                            </span>
                            <span>·</span>
                            <span>{item.year}</span>
                            {item.nextAiringEp && (
                              <>
                                <span>·</span>
                                <span className="text-emerald-300">Ep {item.nextAiringEp} soon</span>
                              </>
                            )}
                          </div>

                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-zinc-400">
                              <span className="text-lagoon-200">{item.progressLabel ?? "Not started"}</span>
                              {item.totalCount > 0 && (
                                <span className="tabular-nums">
                                  {item.progressCount}/{item.totalCount}
                                </span>
                              )}
                            </div>
                            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                              <div className="h-full bg-lagoon-400 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Select value={item.listStatus} onValueChange={(v) => updateEntry(item.seriesId, { status: v as ListStatus })}>
                            <SelectTrigger size="sm" className="h-8 flex-1 min-w-28 text-xs" aria-label={`Status for ${item.title}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS_LABELS).map(([k, label]) => (
                                <SelectItem key={k} value={k}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={item.score ? String(item.score) : "none"}
                            onValueChange={(v) => updateEntry(item.seriesId, { score: v === "none" ? null : Number(v) })}
                          >
                            <SelectTrigger size="sm" className="h-8 w-20 text-xs" aria-label={`Score for ${item.title}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                <span className="inline-flex items-center gap-1 text-zinc-400">
                                  <Star className="size-3" /> —
                                </span>
                              </SelectItem>
                              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                  ★ {n}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Button asChild size="sm" variant="outline" className="h-8 px-2.5 text-xs">
                            <Link href={item.continueHref}>
                              <Play className="size-3" />
                              {item.progressLabel ? "Continue" : item.kind === "ANIME" ? "Watch" : "Read"}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* News & Updates */}
          <aside className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Newspaper className="size-4 text-lagoon-300" />
              News &amp; Releases
            </h2>
            {data.news.length === 0 ? (
              <div className="rounded-xl bg-ink-raised/60 p-5 text-sm text-zinc-400 ring-1 ring-white/[0.06]">
                <Bell className="mb-2 size-5 text-zinc-500" />
                Save ongoing anime or manga to see upcoming episodes, new chapters, and airing updates here.
              </div>
            ) : (
              <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-xl bg-ink-raised/60 ring-1 ring-white/[0.06]">
                {data.news.map((n) => (
                  <li key={n.id}>
                    <Link href={n.href} className="flex items-start gap-3 p-3.5 transition-colors hover:bg-white/[0.03]">
                      <img src={n.coverImage} alt={n.seriesTitle} className="h-14 w-10 shrink-0 rounded object-cover bg-white/5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                              n.badge === "Airing Soon" || n.badge === "Next Episode"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-lagoon-500/15 text-lagoon-200",
                            )}
                          >
                            {n.badge}
                          </span>
                          {n.timestamp && (
                            <span className="text-[11px] tabular-nums text-zinc-500">
                              {new Date(n.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate text-xs font-medium text-white">{n.seriesTitle}</p>
                        <p className="truncate text-xs text-zinc-300">{n.headline}</p>
                        <p className="truncate text-[11px] text-zinc-500">{n.subtext}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ink-raised/60 px-3.5 py-2.5 ring-1 ring-white/[0.06]">
      <p className="text-[11px] uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}
