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

export interface StreamingEpisode {
  title: string | null;
  thumbnail: string | null;
  url: string | null;
  site: string | null;
}

/**
 * Splits AniList streamingEpisodes between the seasons of one franchise (in chain order).
 * Sequels often repeat the whole show's feed ("Episode 1 - Cruelty" under Demon Slayer S2..S5),
 * so an episode belongs to the first season that lists it. Numbering that continues from the
 * previous season ("Episode 27" as S2E1) is shifted back to start at 1.
 */
export function assignStreamingEpisodes(seasons: { episodeCount: number; streamingEpisodes: StreamingEpisode[] }[]) {
  const claimed = new Set<string>();
  return seasons.map((s) => {
    const own = s.streamingEpisodes
      .map((se) => ({ se, parsed: parseStreamingTitle(se.title), key: se.url || se.title || "" }))
      .filter((x): x is typeof x & { parsed: { number: number; title: string } } => !!x.parsed && !claimed.has(x.key));
    for (const x of own) claimed.add(x.key);
    const first = Math.min(...own.map((x) => x.parsed.number));
    const shift = own.length > 0 && first > 1 && Math.max(...own.map((x) => x.parsed.number)) - first < s.episodeCount ? first - 1 : 0;
    return own
      .map((x) => ({ ...x.se, number: x.parsed.number - shift, title: x.parsed.title }))
      .filter((x) => x.number <= s.episodeCount);
  });
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

/** Parses chapter number from title, slug, or chapter string (e.g. "Chapter 1052.5" -> 1052.5). */
export function parseChapterNumber(raw: string | number | undefined, index = 0): number {
  if (typeof raw === "number") return raw;
  if (!raw) return index + 1;
  const match = raw.match(/chapter\s*[-_]?\s*([\d.]+)/i) || raw.match(/([\d.]+)/);
  if (match) {
    const num = parseFloat(match[1]);
    if (!isNaN(num)) return num;
  }
  return index + 1;
}
