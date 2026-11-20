// Kitsu public JSON:API (https://kitsu.docs.apiary.io). No key. Fills episode titles and thumbnails
// that AniList's streamingEpisodes lack (most sequels). Failures return nothing; AniList stays the source of truth.
const API = "https://kitsu.io/api/edge";
const PAGE = 20; // Kitsu's maximum page size

interface KitsuEpisode {
  attributes: { number: number | null; canonicalTitle: string | null; thumbnail: { original?: string } | null };
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: { Accept: "application/vnd.api+json" }, cache: "no-store" });
  if (!res.ok) throw new Error(`Kitsu HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

/** Episode number → title and thumbnail for one AniList media (one season). */
export async function kitsuEpisodes(anilistId: string, episodeCount: number) {
  const out = new Map<number, { title: string; thumbnail: string | null }>();
  try {
    const mapping = await get<{ included?: { id: string }[] }>(
      `/mappings?filter[externalSite]=anilist/anime&filter[externalId]=${anilistId}&include=item`,
    );
    const kitsuId = mapping.included?.[0]?.id;
    if (!kitsuId) return out;

    // Pages in batches of 8, so a 1000-episode show doesn't fire 50 requests at once.
    const episodes: KitsuEpisode[] = [];
    const pages = Math.ceil(episodeCount / PAGE);
    for (let p = 0; p < pages; p += 8) {
      const batch = await Promise.all(
        Array.from({ length: Math.min(8, pages - p) }, (_, k) =>
          get<{ data: KitsuEpisode[] }>(`/anime/${kitsuId}/episodes?sort=number&page[limit]=${PAGE}&page[offset]=${(p + k) * PAGE}`),
        ),
      );
      for (const r of batch) episodes.push(...r.data);
    }
    for (const { attributes: a } of episodes) {
      const title = a.canonicalTitle?.trim();
      if (!a.number || a.number > episodeCount || !title || /^episode \d+$/i.test(title)) continue;
      out.set(a.number, { title, thumbnail: a.thumbnail?.original ?? null });
    }
  } catch (err) {
    console.warn(`kitsu ${anilistId}:`, err instanceof Error ? err.message : err);
  }
  return out;
}
