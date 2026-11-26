import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { checkRateLimit, tooManyRequestsResponse } from "@/server/http";

export const dynamic = "force-dynamic";

type Kind = "ANIME" | "MANGA";
interface Result {
  id: string;
  type: Kind;
  title: string;
  nativeTitle: string;
  cover: string;
  href: string;
  meta: string;
  rating: number;
}

function toResult(r: {
  id: number | string;
  kind: Kind;
  title: string;
  altTitle: string;
  cover: string;
  format: string | null;
  year: number | null;
  count: number | null;
  rating: number;
  parentId?: string | null;
}): Result {
  const unit = r.kind === "ANIME" ? "eps" : "chs";
  const countStr = r.count && r.count > 0 ? `${r.count} ${unit}` : "Ongoing";
  return {
    id: String(r.id),
    type: r.kind,
    title: r.title,
    nativeTitle: r.altTitle,
    cover: r.cover,
    href: `/${r.kind.toLowerCase()}/${r.parentId ?? r.id}`,
    meta: [r.year, r.format?.replace(/_/g, " "), countStr].filter(Boolean).join(" · "),
    rating: r.rating,
  };
}

/** Local index: strict substring match on terms or title, prefix hits first. */
async function localSearch(q: string, kind: Kind | null): Promise<Result[]> {
  const like = q.toLowerCase().replace(/[\\%_]/g, "\\$&");
  const rows = await db().$queryRaw<Parameters<typeof toResult>[0][]>`
    SELECT e.id, e.kind::text AS kind, e.title, e."altTitle", e.cover, e.format, e.year, e.count, e.rating, s."seriesId" AS "parentId"
    FROM "SearchEntry" e
    LEFT JOIN "Season" s ON s.id = e.id::text AND s."seriesId" <> s.id
    WHERE e.terms ILIKE ${`%${like}%`}
      ${kind ? Prisma.sql`AND e.kind = ${kind}::"SeriesKind"` : Prisma.empty}
    ORDER BY lower(e.title) LIKE ${`${like}%`} DESC, e.popularity DESC
    LIMIT 20`;
  const seen = new Set<string>();
  return rows.map(toResult).filter((r) => !seen.has(r.href) && seen.add(r.href));
}

// Live search over the entire AniList database
const LIVE_QUERY = `query ($search: String, $type: MediaType) {
  Page(perPage: 15) { media(search: $search, type: $type, sort: POPULARITY_DESC, isAdult: false) {
    id type format episodes chapters averageScore seasonYear startDate { year } title { english romaji } coverImage { large }
  } }
}`;

async function liveSearch(q: string, kind: Kind | null): Promise<Result[]> {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: LIVE_QUERY, variables: { search: q, type: kind ?? undefined } }),
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data?.Page?.media ?? []).map((m: any) =>
    toResult({
      id: m.id,
      kind: m.type,
      title: m.title?.english || m.title?.romaji || `#${m.id}`,
      altTitle: m.title?.romaji || "",
      cover: m.coverImage?.large || "",
      format: m.format,
      year: m.seasonYear || m.startDate?.year || null,
      count: m.episodes ?? m.chapters,
      rating: m.averageScore ? m.averageScore / 10 : 0,
    }),
  );
}

export async function GET(request: NextRequest) {
  const rl = await checkRateLimit(request, "search", 45, 60_000);
  if (!rl.ok) return tooManyRequestsResponse(rl.headers);

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().slice(0, 100) || "";
  const type = searchParams.get("type")?.toUpperCase();
  const kind: Kind | null = type === "ANIME" || type === "MANGA" ? type : null;
  if (q.length < 2) return NextResponse.json({ results: [] });

  const [localHits, liveHits] = await Promise.all([
    env.DATABASE_URL ? localSearch(q, kind).catch(() => []) : Promise.resolve([]),
    liveSearch(q, kind).catch(() => []),
  ]);

  const qLower = q.toLowerCase();
  const allHits = [...localHits, ...liveHits];

  // Strictly filter out any hit that does not contain the searched term in title or altTitle
  const relevantHits = allHits.filter((r) => {
    const t = r.title.toLowerCase();
    const alt = (r.nativeTitle || "").toLowerCase();
    return t.includes(qLower) || alt.includes(qLower);
  });

  const candidates = relevantHits.length > 0 ? relevantHits : allHits;

  // Rank by exact match, prefix match, then popularity/rating
  candidates.sort((a, b) => {
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();
    const aScore = aTitle === qLower ? 4 : aTitle.startsWith(qLower) ? 3 : aTitle.includes(qLower) ? 2 : 1;
    const bScore = bTitle === qLower ? 4 : bTitle.startsWith(qLower) ? 3 : bTitle.includes(qLower) ? 2 : 1;
    if (bScore !== aScore) return bScore - aScore;
    return b.rating - a.rating;
  });

  const seen = new Set<string>();
  const merged: Result[] = [];
  for (const r of candidates) {
    if (!seen.has(r.href)) {
      seen.add(r.href);
      merged.push(r);
    }
    if (merged.length >= 20) break;
  }

  return NextResponse.json(
    { results: merged },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } }
  );
}
