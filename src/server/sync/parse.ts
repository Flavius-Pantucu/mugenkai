// Pure mapping helpers for the sync jobs. No imports, so `node --test` can run them directly.

/** AniList descriptions are HTML with source credits; keep readable text only. */
export const cleanDescription = (html: string | null) =>
  (html ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\(Source:[^)]*\)/gi, "")
    .replace(/\n{2,}/g, "\n\n")
    .trim();

export const toStatus = (s: string | null) => (s === "RELEASING" || s === "HIATUS" ? "ONGOING" : "COMPLETED") as "ONGOING" | "COMPLETED";

/** Aired episodes: the final count, or (while airing) the one before the next to air. */
export const airedEpisodes = (m: { episodes: number | null; status: string | null; nextAiringEpisode: { episode: number } | null }) =>
  m.status === "RELEASING" && m.nextAiringEpisode ? Math.max(m.nextAiringEpisode.episode - 1, 1) : (m.episodes ?? 12);

/** "Episode 5 - The Title" → { number: 5, title: "The Title" }. */
export function parseStreamingTitle(title: string | null): { number: number; title: string } | null {
  const m = title?.match(/^Episode\s+(\d+)\s*[-–:]\s*(.+)$/i);
  // Episode numbers start at 1; "Episode 0" prologues have no row to attach to.
  return m && Number(m[1]) >= 1 ? { number: Number(m[1]), title: m[2].trim() } : null;
}

export interface MdChapter {
  id: string;
  attributes: { chapter: string | null; title: string | null; pages: number; externalUrl: string | null; publishAt: string };
  relationships: { type: string; attributes?: { name?: string } }[];
}

/** One chapter per number: prefer a version with pages hosted on MangaDex, else an official external link. */
export function pickChapters(rows: MdChapter[]): [number, MdChapter][] {
  const hosted = (x: MdChapter) => x.attributes.pages > 0 && !x.attributes.externalUrl;
  const best = new Map<number, MdChapter>();
  for (const c of rows) {
    const n = Number(c.attributes.chapter);
    if (c.attributes.chapter === null || Number.isNaN(n)) continue;
    const cur = best.get(n);
    if (!cur || (hosted(c) && !hosted(cur))) best.set(n, c);
  }
  return [...best.entries()].sort((a, b) => a[0] - b[0]);
}
