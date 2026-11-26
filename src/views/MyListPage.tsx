"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, BookOpen, Bookmark, Newspaper, Star, Trash2, Tv } from "lucide-react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
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

export function MyListPage({ data, signedIn }: { data: MyListData | null; signedIn: boolean }) {
  const [items, setItems] = useState(data?.items ?? []);
  const [kind, setKind] = useState<"ALL" | "ANIME" | "MANGA">("ALL");
  const [status, setStatus] = useState<"ALL" | ListStatus>("ALL");

  const filtered = useMemo(
    () => items.filter((it) => (kind === "ALL" || it.kind === kind) && (status === "ALL" || it.listStatus === status)),
    [items, kind, status],
  );

  const updateStatus = async (seriesId: string, nextStatus: ListStatus) => {
    const prev = items;
    setItems((cur) => cur.map((x) => (x.seriesId === seriesId ? { ...x, listStatus: nextStatus } : x)));
    try {
      const res = await fetch(`/api/list/${seriesId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success("List updated");
    } catch {
      setItems(prev);
      toast.error("Couldn't update status");
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
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">My List</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {items.length} saved {items.length === 1 ? "title" : "titles"} · Live release updates for your library
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ToggleGroup type="single" value={kind} onValueChange={(v) => v && setKind(v as typeof kind)} variant="outline" size="sm">
              <ToggleGroupItem value="ALL">All</ToggleGroupItem>
              <ToggleGroupItem value="ANIME">Anime</ToggleGroupItem>
              <ToggleGroupItem value="MANGA">Manga</ToggleGroupItem>
            </ToggleGroup>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              aria-label="Filter by status"
              className="h-9 rounded-md border border-white/10 bg-ink-raised px-3 text-sm text-white"
            >
              <option value="ALL">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </header>

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
                {filtered.map((item) => (
                  <div
                    key={item.seriesId}
                    className="flex gap-3.5 rounded-xl bg-ink-raised/60 p-3 ring-1 ring-white/[0.06] transition-colors hover:bg-ink-raised"
                  >
                    <Link href={`/${item.kind.toLowerCase()}/${item.seriesId}`} className="shrink-0">
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="h-28 w-20 rounded-lg object-cover bg-white/5"
                      />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
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
                          {item.score && (
                            <>
                              <span>·</span>
                              <span className="inline-flex items-center gap-0.5 text-amber-300">
                                <Star className="size-3 fill-current" />
                                {item.score}
                              </span>
                            </>
                          )}
                        </div>
                        {item.progressLabel && (
                          <p className="mt-1 text-xs text-lagoon-200">
                            Progress: {item.progressLabel}
                            {item.totalCount ? ` / ${item.totalCount}` : ""}
                          </p>
                        )}
                        {item.nextAiringEp && (
                          <p className="mt-0.5 text-xs text-emerald-300">Next: Episode {item.nextAiringEp} airing</p>
                        )}
                      </div>

                      <div className="mt-2">
                        <select
                          value={item.listStatus}
                          onChange={(e) => updateStatus(item.seriesId, e.target.value as ListStatus)}
                          aria-label={`Status for ${item.title}`}
                          className="h-7 w-full rounded border border-white/10 bg-ink px-2 text-xs text-zinc-200"
                        >
                          {Object.entries(STATUS_LABELS).map(([k, label]) => (
                            <option key={k} value={k}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
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
                              {new Date(n.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
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
