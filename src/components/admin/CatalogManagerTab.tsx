"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Check, Edit3, Layers, Link2, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  addStreamingLink,
  deleteChapter,
  deleteEpisode,
  deleteSeries,
  deleteStreamingLink,
  getSeriesDetailsForAdmin,
  retryMissingMangaChapters,
  updateSeason,
  upsertChapter,
  upsertEpisode,
  upsertSeries,
  type UpsertSeriesInput,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { AdminData } from "@/server/admin";

type SeriesRow = AdminData["series"][number];
type SeriesDetails = Awaited<ReturnType<typeof getSeriesDetailsForAdmin>>;

const fmtNum = new Intl.NumberFormat("en-US");

export function CatalogManagerTab({ data }: { data: AdminData }) {
  const c = data.counts;
  const { mangaWithoutChapters, animeWithoutLinks, airing } = data.gaps;
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"ALL" | "ANIME" | "MANGA">("ALL");
  const [editing, setEditing] = useState<UpsertSeriesInput | null>(null);
  const [managing, setManaging] = useState<SeriesRow | null>(null);
  const [details, setDetails] = useState<SeriesDetails | null>(null);
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.series.filter(
      (s) =>
        (kindFilter === "ALL" || s.kind === kindFilter) &&
        (!q || s.title.toLowerCase().includes(q) || s.nativeTitle.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)),
    );
  }, [data.series, query, kindFilter]);

  const openManage = (s: SeriesRow) => {
    setManaging(s);
    setDetails(null);
    start(async () => {
      try {
        setDetails(await getSeriesDetailsForAdmin(s.id));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load series details");
      }
    });
  };

  const refreshDetails = async (seriesId: string) => {
    setDetails(await getSeriesDetailsForAdmin(seriesId));
  };

  const totals = [
    [c.anime, "anime"],
    [c.seasons, "seasons"],
    [c.episodes, "episodes"],
    [c.manga, "manga"],
    [c.chapters, "chapters"],
    [c.links, "streaming links"],
    [c.searchEntries, "search entries"],
  ] as const;

  return (
    <div className="space-y-8 pt-6">
      {/* Catalog vs Search Index vs AniList Upstream Totals */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-ink-raised/60 p-4 ring-1 ring-white/[0.06]">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Anime Reach</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <div>
              <span className="text-2xl font-semibold tabular-nums text-white">{fmtNum.format(c.anime)}</span>
              <span className="ml-1.5 text-xs text-zinc-400">curated in DB</span>
            </div>
            <div>
              <span className="text-lg font-semibold tabular-nums text-lagoon-200">{fmtNum.format(c.searchAnimeEntries)}</span>
              <span className="ml-1.5 text-xs text-zinc-400">indexed for search</span>
            </div>
            {c.anilistAnimeTotal !== null && (
              <div>
                <span className="text-lg font-semibold tabular-nums text-zinc-200">{fmtNum.format(c.anilistAnimeTotal)}</span>
                <span className="ml-1.5 text-xs text-zinc-400">total on AniList</span>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Curated rows preload the homepage &amp; browse shelves; users can search any of the {fmtNum.format(c.searchAnimeEntries)} indexed or live AniList titles.
          </p>
        </div>

        <div className="rounded-lg bg-ink-raised/60 p-4 ring-1 ring-white/[0.06]">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Manga Reach</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <div>
              <span className="text-2xl font-semibold tabular-nums text-white">{fmtNum.format(c.manga)}</span>
              <span className="ml-1.5 text-xs text-zinc-400">curated in DB</span>
            </div>
            <div>
              <span className="text-lg font-semibold tabular-nums text-lagoon-200">{fmtNum.format(c.searchMangaEntries)}</span>
              <span className="ml-1.5 text-xs text-zinc-400">indexed for search</span>
            </div>
            {c.anilistMangaTotal !== null && (
              <div>
                <span className="text-lg font-semibold tabular-nums text-zinc-200">{fmtNum.format(c.anilistMangaTotal)}</span>
                <span className="ml-1.5 text-xs text-zinc-400">total on AniList</span>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Curated rows preload the shelves; search covers all {fmtNum.format(c.searchMangaEntries)} local index entries plus live AniList search.
          </p>
        </div>
      </div>

      {/* Totals */}
      <dl className="flex flex-wrap gap-x-8 gap-y-3">
        {totals.map(([n, label]) => (
          <div key={label} className="flex flex-col-reverse">
            <dt className="text-xs text-zinc-400">{label}</dt>
            <dd className="text-xl font-semibold tabular-nums text-white">{fmtNum.format(n)}</dd>
          </div>
        ))}
      </dl>

      {/* Gap Lists */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-3">
        <GapList
          title="Manga without chapters"
          why="No chapter source matched yet. Retry via MangaPill, WeebCentral, MangaHere & MangaKakalot."
          empty="Every manga has chapters."
          items={mangaWithoutChapters.map((m) => ({ id: m.id, href: `/manga/${m.id}`, title: m.title, meta: String(m.year) }))}
          action={
            mangaWithoutChapters.length > 0 ? (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    try {
                      const res = await retryMissingMangaChapters();
                      toast.success(`Checked ${res.checked} manga: filled ${res.filled} (${res.chaptersAdded} chapters added)`);
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Failed to sync missing chapters");
                    }
                  })
                }
              >
                <RefreshCw className={cn("size-3.5", pending && "animate-spin")} />
                {pending ? "Searching providers…" : "Find & sync chapters"}
              </Button>
            ) : undefined
          }
        />
        <GapList
          title="Anime without streaming links"
          why="No official stream is listed."
          empty="Every anime has a streaming link."
          items={animeWithoutLinks.map((a) => ({ id: a.id, href: `/anime/${a.id}`, title: a.title, meta: String(a.year) }))}
        />
        <GapList
          title="Airing now"
          why="Seasons the hourly airing job checks for new episodes."
          empty="Nothing in the catalog is airing."
          neutral
          items={airing.map((s) => ({
            id: s.id,
            href: `/anime/${s.series.id}`,
            title: s.number > 1 ? `${s.series.title} · S${s.number}` : s.series.title,
            meta: `${s.episodeCount} ep`,
          }))}
        />
      </div>

      {/* Series CRUD Table */}
      <section className="space-y-3 border-t border-white/[0.06] pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Title or ID" className="h-9 pl-8" />
            </div>
            <ToggleGroup type="single" value={kindFilter} onValueChange={(v) => v && setKindFilter(v as typeof kindFilter)} variant="outline" size="sm">
              <ToggleGroupItem value="ALL">All</ToggleGroupItem>
              <ToggleGroupItem value="ANIME">Anime</ToggleGroupItem>
              <ToggleGroupItem value="MANGA">Manga</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <Button
            size="sm"
            onClick={() =>
              setEditing({
                id: "",
                kind: "ANIME",
                title: "",
                nativeTitle: "",
                description: "",
                coverImage: "",
                bannerImage: "",
                color: "#22d3ee",
                status: "ONGOING",
                rating: 8.0,
                popularity: 1000,
                year: 2026,
                genres: ["Action"],
              })
            }
          >
            <Plus className="size-4" />
            Add series
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg ring-1 ring-white/[0.06]">
          <Table className="min-w-[820px]">
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent">
                <TableHead>Title</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead className="text-right">Content</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id} className="border-white/[0.06]">
                  <TableCell className="max-w-xs">
                    <Link href={`/${s.kind.toLowerCase()}/${s.id}`} className="truncate font-medium text-white hover:text-lagoon-300">
                      {s.title}
                    </Link>
                    <p className="truncate text-xs text-zinc-400">
                      #{s.id} · {s.year}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-300">{s.kind}</TableCell>
                  <TableCell className="text-xs text-zinc-400">{s.status}</TableCell>
                  <TableCell className="text-right tabular-nums text-zinc-200">{s.rating.toFixed(1)}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-zinc-400">
                    {s.kind === "ANIME"
                      ? `${s.seasonsCount}s · ${s.episodesCount}ep · ${s.linksCount} links`
                      : `${s.chaptersCount}ch · ${s.linksCount} links`}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openManage(s)} title="Manage episodes, chapters & links">
                        <Layers className="size-3.5" />
                        Content
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Edit metadata"
                        onClick={() =>
                          setEditing({
                            id: s.id,
                            kind: s.kind,
                            title: s.title,
                            nativeTitle: s.nativeTitle,
                            description: s.description,
                            coverImage: s.coverImage,
                            bannerImage: s.bannerImage,
                            color: s.color,
                            status: s.status,
                            rating: s.rating,
                            popularity: s.popularity,
                            year: s.year,
                            genres: s.genres,
                            studio: s.studio,
                            episodeDuration: s.episodeDuration,
                            trailerYoutubeId: s.trailerYoutubeId,
                            author: s.author,
                            volumeCount: s.volumeCount,
                            chapterTotal: s.chapterTotal,
                            mangadexId: s.mangadexId,
                            malId: s.malId,
                          })
                        }
                      >
                        <Edit3 className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={pending}
                        title="Delete series"
                        onClick={() =>
                          start(async () => {
                            await deleteSeries(s.id);
                            toast.success(`Deleted ${s.title}`);
                          })
                        }
                      >
                        <Trash2 className="size-4 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <SeriesEditorDialog series={editing} onClose={() => setEditing(null)} />
      <SeriesContentDialog series={managing} details={details} onRefresh={refreshDetails} onClose={() => setManaging(null)} />
    </div>
  );
}

function GapList({
  title,
  why,
  empty,
  items,
  neutral,
  action,
}: {
  title: string;
  why: string;
  empty: string;
  items: { id: string; href: string; title: string; meta: string }[];
  neutral?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-baseline gap-2 text-sm font-medium text-white">
          {title}
          <span className={cn("tabular-nums", items.length > 0 && !neutral ? "text-amber-200" : "text-zinc-400")}>{items.length}</span>
        </h3>
        {action}
      </div>
      <p className="mt-1 text-[13px] leading-snug text-zinc-400">{why}</p>
      {items.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-[13px] text-lagoon-200">
          <Check className="size-3.5" />
          {empty}
        </p>
      ) : (
        <ul className="mt-3 max-h-60 divide-y divide-white/[0.05] overflow-y-auto border-y border-white/[0.06]">
          {items.map((it) => (
            <li key={it.id}>
              <Link href={it.href} className="flex items-baseline justify-between gap-3 px-1 py-2 text-[13px] transition-colors hover:bg-white/[0.03]">
                <span className="truncate text-zinc-200">{it.title}</span>
                <span className="shrink-0 tabular-nums text-zinc-400">{it.meta}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SeriesEditorDialog({ series, onClose }: { series: UpsertSeriesInput | null; onClose: () => void }) {
  const [form, setForm] = useState<UpsertSeriesInput | null>(series);
  const [genresText, setGenresText] = useState(series?.genres.join(", ") ?? "");
  const [pending, start] = useTransition();

  if (series && form?.id !== series.id && form?.title !== series.title) {
    setForm(series);
    setGenresText(series.genres.join(", "));
  }
  const current = form ?? series;

  const save = () => {
    if (!current) return;
    start(async () => {
      try {
        await upsertSeries({
          ...current,
          genres: genresText
            .split(",")
            .map((g) => g.trim())
            .filter(Boolean),
        });
        toast.success(`Saved ${current.title}`);
        onClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save series");
      }
    });
  };

  return (
    <Dialog open={series !== null} onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{series?.id ? `Edit ${series.title}` : "Add New Series"}</DialogTitle>
        </DialogHeader>
        {current && (
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>ID (AniList ID or slug)</Label>
              <Input value={current.id} disabled={Boolean(series?.id)} onChange={(e) => setForm({ ...current, id: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Kind</Label>
              <select
                value={current.kind}
                onChange={(e) => setForm({ ...current, kind: e.target.value as "ANIME" | "MANGA" })}
                className="flex h-9 w-full rounded-md border border-white/10 bg-ink px-3 text-sm text-white"
              >
                <option value="ANIME">ANIME</option>
                <option value="MANGA">MANGA</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={current.title} onChange={(e) => setForm({ ...current, title: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Native Title</Label>
              <Input value={current.nativeTitle} onChange={(e) => setForm({ ...current, nativeTitle: e.target.value })} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Description</Label>
              <Textarea rows={3} value={current.description} onChange={(e) => setForm({ ...current, description: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Cover Image URL</Label>
              <Input value={current.coverImage} onChange={(e) => setForm({ ...current, coverImage: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Banner Image URL</Label>
              <Input value={current.bannerImage} onChange={(e) => setForm({ ...current, bannerImage: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <select
                value={current.status}
                onChange={(e) => setForm({ ...current, status: e.target.value as "ONGOING" | "COMPLETED" })}
                className="flex h-9 w-full rounded-md border border-white/10 bg-ink px-3 text-sm text-white"
              >
                <option value="ONGOING">ONGOING</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Genres (comma-separated)</Label>
              <Input value={genresText} onChange={(e) => setGenresText(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Year</Label>
              <Input type="number" value={current.year} onChange={(e) => setForm({ ...current, year: Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <Label>Rating (0-10)</Label>
              <Input type="number" step="0.1" value={current.rating} onChange={(e) => setForm({ ...current, rating: Number(e.target.value) })} />
            </div>
            {current.kind === "ANIME" ? (
              <>
                <div className="space-y-1">
                  <Label>Studio</Label>
                  <Input value={current.studio ?? ""} onChange={(e) => setForm({ ...current, studio: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Trailer YouTube ID</Label>
                  <Input value={current.trailerYoutubeId ?? ""} onChange={(e) => setForm({ ...current, trailerYoutubeId: e.target.value })} />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <Label>Author</Label>
                  <Input value={current.author ?? ""} onChange={(e) => setForm({ ...current, author: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>MangaDex ID</Label>
                  <Input value={current.mangadexId ?? ""} onChange={(e) => setForm({ ...current, mangadexId: e.target.value })} />
                </div>
              </>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save series"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SeriesContentDialog({
  series,
  details,
  onRefresh,
  onClose,
}: {
  series: SeriesRow | null;
  details: SeriesDetails | null;
  onRefresh: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const [provider, setProvider] = useState("Crunchyroll");
  const [linkUrl, setLinkUrl] = useState("");
  const [epNum, setEpNum] = useState(1);
  const [epTitle, setEpTitle] = useState("");
  const [chNum, setChNum] = useState(1);
  const [chTitle, setChTitle] = useState("");
  const [chExtUrl, setChExtUrl] = useState("");
  const [pending, start] = useTransition();

  if (!series) return null;

  return (
    <Dialog open={series !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Content — {series.title}</DialogTitle>
        </DialogHeader>

        {!details ? (
          <p className="py-8 text-center text-sm text-zinc-400">Loading series content…</p>
        ) : (
          <div className="space-y-6 py-2">
            {/* Streaming / Official Links */}
            <div className="space-y-3 rounded-lg bg-ink-raised/60 p-4 ring-1 ring-white/[0.06]">
              <h4 className="flex items-center gap-2 text-sm font-medium text-white">
                <Link2 className="size-4 text-lagoon-300" />
                Streaming / Official Links ({details.links.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                <Input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Provider" className="w-36" />
                <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." className="min-w-48 flex-1" />
                <Button
                  size="sm"
                  disabled={pending || !linkUrl.trim()}
                  onClick={() =>
                    start(async () => {
                      await addStreamingLink({ seriesId: series.id, provider, url: linkUrl });
                      setLinkUrl("");
                      await onRefresh(series.id);
                      toast.success("Link added");
                    })
                  }
                >
                  Add
                </Button>
              </div>
              <ul className="divide-y divide-white/[0.06] text-xs">
                {details.links.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 py-1.5">
                    <span className="truncate text-zinc-300">
                      <strong className="text-white">{l.provider}:</strong> {l.url}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={pending}
                      onClick={() =>
                        start(async () => {
                          await deleteStreamingLink(l.id);
                          await onRefresh(series.id);
                        })
                      }
                    >
                      <Trash2 className="size-3.5 text-red-400" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>

            {series.kind === "ANIME" ? (
              <>
                {/* Seasons */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-white">Seasons ({details.seasons.length})</h4>
                  {details.seasons.map((se) => (
                    <div key={se.id} className="flex flex-wrap items-center justify-between gap-3 rounded bg-white/[0.03] px-3 py-2 text-xs">
                      <span className="text-white">
                        S{se.number}: {se.title} ({se.episodeCount} eps)
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400">Airing</span>
                        <Switch
                          checked={se.airing}
                          onCheckedChange={(v) =>
                            start(async () => {
                              await updateSeason({ ...se, airing: v });
                              await onRefresh(series.id);
                              toast.success("Season updated");
                            })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Episodes */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-white">Episodes ({details.episodes.length})</h4>
                  {details.seasons[0] && (
                    <div className="flex flex-wrap gap-2">
                      <Input type="number" value={epNum} onChange={(e) => setEpNum(Number(e.target.value))} className="w-20" placeholder="Ep #" />
                      <Input value={epTitle} onChange={(e) => setEpTitle(e.target.value)} placeholder="Episode title" className="min-w-48 flex-1" />
                      <Button
                        size="sm"
                        disabled={pending || !epTitle.trim()}
                        onClick={() =>
                          start(async () => {
                            await upsertEpisode({
                              seriesId: series.id,
                              seasonId: details.seasons[0].id,
                              seasonNumber: details.seasons[0].number,
                              number: epNum,
                              title: epTitle,
                              thumbnail: series.bannerImage || series.coverImage,
                              duration: (series.episodeDuration ?? 24) * 60,
                            });
                            setEpTitle("");
                            await onRefresh(series.id);
                            toast.success(`Saved Episode ${epNum}`);
                          })
                        }
                      >
                        Add / Update Ep
                      </Button>
                    </div>
                  )}
                  <ul className="max-h-48 divide-y divide-white/[0.06] overflow-y-auto text-xs">
                    {details.episodes.map((ep) => (
                      <li key={ep.id} className="flex items-center justify-between gap-2 py-1.5">
                        <span className="truncate text-zinc-200">
                          S{ep.seasonNumber} E{ep.number} — {ep.title}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={pending}
                          onClick={() =>
                            start(async () => {
                              await deleteEpisode(ep.id);
                              await onRefresh(series.id);
                            })
                          }
                        >
                          <Trash2 className="size-3.5 text-red-400" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              /* Chapters */
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white">Chapters ({details.chapters.length})</h4>
                <div className="flex flex-wrap gap-2">
                  <Input type="number" step="0.5" value={chNum} onChange={(e) => setChNum(Number(e.target.value))} className="w-24" placeholder="Ch #" />
                  <Input value={chTitle} onChange={(e) => setChTitle(e.target.value)} placeholder="Chapter title" className="min-w-40 flex-1" />
                  <Input value={chExtUrl} onChange={(e) => setChExtUrl(e.target.value)} placeholder="External URL (optional)" className="min-w-40 flex-1" />
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        await upsertChapter({
                          seriesId: series.id,
                          number: chNum,
                          title: chTitle || `Chapter ${chNum}`,
                          pageCount: 0,
                          externalUrl: chExtUrl || null,
                        });
                        setChTitle("");
                        setChExtUrl("");
                        await onRefresh(series.id);
                        toast.success(`Saved Chapter ${chNum}`);
                      })
                    }
                  >
                    Add / Update Ch
                  </Button>
                </div>
                <ul className="max-h-48 divide-y divide-white/[0.06] overflow-y-auto text-xs">
                  {details.chapters.map((ch) => (
                    <li key={ch.id} className="flex items-center justify-between gap-2 py-1.5">
                      <span className="truncate text-zinc-200">
                        Ch. {ch.number} — {ch.title} ({ch.pageCount}p)
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          start(async () => {
                            await deleteChapter(ch.id);
                            await onRefresh(series.id);
                          })
                        }
                      >
                        <Trash2 className="size-3.5 text-red-400" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
