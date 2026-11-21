import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { env } from "@/server/env";

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

function toResult(r: { id: number; kind: Kind; title: string; altTitle: string; cover: string; format: string | null; year: number | null; count: number | null; rating: number; parentId?: string | null }): Result {
  const unit = r.kind === "ANIME" ? "eps" : "chs";
  return {
    id: String(r.id),
    type: r.kind,
    title: r.title,
    nativeTitle: r.altTitle,
    cover: r.cover,
    // A later season stored under its series (Stone Ocean under JoJo) opens the series page.
    href: `/${r.kind.toLowerCase()}/${r.parentId ?? r.id}`,
    meta: [r.year, r.format?.replace(/_/g, " "), r.count ? `${r.count} ${unit}` : "Ongoing"].filter(Boolean).join(" · "),
    rating: r.rating,
  };
}

/** Local index: substring hits first (title prefix, then popularity), typo-tolerant trigram hits after. */
async function localSearch(q: string, kind: Kind | null) {
  const like = q.toLowerCase().replace(/[\\%_]/g, "\\$&");
  const rows = await db().$queryRaw<Parameters<typeof toResult>[0][]>`
    SELECT e.id, e.kind::text AS kind, e.title, e."altTitle", e.cover, e.format, e.year, e.count, e.rating, s."seriesId" AS "parentId"
    FROM "SearchEntry" e
    LEFT JOIN "Season" s ON s.id = e.id::text AND s."seriesId" <> s.id
    WHERE (e.terms LIKE ${`%${like}%`} OR ${q.toLowerCase()} <% e.terms)
      ${kind ? Prisma.sql`AND e.kind = ${kind}::"SeriesKind"` : Prisma.empty}
    ORDER BY e.terms LIKE ${`%${like}%`} DESC, lower(e.title) LIKE ${`${like}%`} DESC, e.popularity DESC
    LIMIT 20`;
  // Several seasons of one series collapse to its best-ranked hit.
  const seen = new Set<string>();
  return rows.map(toResult).filter((r) => !seen.has(r.href) && seen.add(r.href));
}

// Fallback for an empty index (fresh database, or seeding still running).
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
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().slice(0, 100) || "";
  const type = searchParams.get("type")?.toUpperCase();
  const kind: Kind | null = type === "ANIME" || type === "MANGA" ? type : null;
  if (q.length < 2) return NextResponse.json({ results: [] });

  let results: Result[] = [];
  if (env.DATABASE_URL) {
    try {
      results = await localSearch(q, kind);
    } catch (err) {
      console.error("[search] local index failed:", err);
    }
  }
  if (results.length === 0) results = await liveSearch(q, kind).catch(() => []);
  return NextResponse.json({ results }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
}
