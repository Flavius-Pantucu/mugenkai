/**
 * Subtitle scoping.
 *
 * Subtitle timings are authored against one specific encode. Pooling tracks
 * across servers therefore produces visible mismatches: the text is for the
 * right episode but drifts against the audio, and on a DUB stream it can be a
 * translation of dialogue that is not being spoken.
 *
 * Every track is tagged with the identity of the source it shipped with — the
 * owning source id, a normalised server key and the audio track it was authored
 * against — and the player only ever shows tracks whose tag matches the source
 * that is playing. The one permitted fallback is within a single server (a DUB
 * stream borrowing the captions of the SUB stream of the *same* server, which is
 * the same encode); nothing is ever borrowed across servers.
 *
 * Dependency-free on purpose: imported by both the player component and its
 * helpers, which import each other.
 */

export type AudioTrackType = "SUB" | "DUB";

/** Minimum shape needed to identify a source. */
export interface ScopableSource {
  id?: string | null;
  type?: string | null;
  serverName?: string | null;
  videoUrl?: string | null;
}

/** A subtitle track as it arrives from the database or /api/play. */
export interface RawSubtitle {
  id?: string | null;
  language?: string | null;
  label?: string | null;
  subtitleUrl?: string | null;
  url?: string | null;
  file?: string | null;
  link?: string | null;
  isDefault?: boolean | null;
  default?: boolean | null;
  server?: string | null;
}

/** A subtitle track tagged with the source it belongs to. */
export interface ScopedSubtitle {
  id: string;
  language: string;
  label: string;
  subtitleUrl: string;
  isDefault: boolean;
  /** Id of the VideoSource this track shipped with, when known. */
  sourceId?: string;
  /** Normalised server identity — the scope this track may be shown in. */
  serverKey: string;
  /** Audio track the timings were authored against. */
  audioType: AudioTrackType;
  /** True when borrowed from another source of the same server. */
  borrowed: boolean;
  /** Same-scope mirrors of this track, used as load fallbacks. */
  alternativeUrls: string[];
}

/** Scope key used when a source cannot be identified at all. */
const UNKNOWN_SCOPE = "unknown";

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/\((eng\s*)?(sub|dub)\)/g, "")
    .replace(/\b(english|japanese)\s+dub\b/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Normalised identity of the server behind a source.
 */
export function getServerScopeKey(source?: ScopableSource | null): string {
  if (!source) return UNKNOWN_SCOPE;

  const name = (source.serverName || "").toLowerCase().trim();
  const id = (source.id || "").toLowerCase().trim();
  const url = (source.videoUrl || "").toLowerCase().trim();

  // Server Buzz (megaplay.buzz) — SUB and DUB are the same encode.
  if (name.includes("buzz") || url.includes("server=buzz") || id.includes("buzz")) return "buzz";

  // Animex / AniEmbed extractor (Yuri, Zuri)
  if (name.includes("zuri") || id.includes("zuri") || url.includes("server=zuri")) return "zuri";
  if (name.includes("yuri") || id.includes("yuri") || url.includes("server=yuri")) return "yuri";

  if (url.includes("animex") || name.includes("animex") || url.includes("provider=")) {
    try {
      const parsed = new URL(url, "http://localhost");
      const provider = parsed.searchParams.get("provider") || parsed.searchParams.get("providerId");
      if (provider) return `animex-${slug(provider)}`;
    } catch {}
    return "animex";
  }

  // Flow / Re:ANIME (HD-1 / HD-2 / Kitty).
  if (
    name.includes("flow") ||
    name.includes("kitty") ||
    name.includes("reanime") ||
    id.startsWith("flow-") ||
    id.startsWith("kitty-") ||
    url.includes("flixcloud") ||
    url.includes("rundowncdn") ||
    url.includes("atomic4cdn") ||
    /\bhd[-\s]?[12]\b/.test(name)
  ) {
    if (
      name.includes("flow 2") ||
      name.includes("flow-2") ||
      name.includes("kitty") ||
      id.startsWith("kitty") ||
      name.includes("hd-2") ||
      url.includes("server=hd-2") ||
      url.includes("server=kitty")
    )
      return "flow-2";
    return "flow-1";
  }

  const named = slug(name);
  if (named) return named;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      return `host-${slug(new URL(url).hostname)}`;
    } catch {}
  }

  if (id) return `src-${id}`;
  return UNKNOWN_SCOPE;
}

function normaliseAudioType(type?: string | null): AudioTrackType {
  return (type || "").toUpperCase() === "DUB" ? "DUB" : "SUB";
}

const DUMMY_URL_MARKERS = [
  "brenopolanski",
  "html5-video-webvtt-example",
  "example.com",
  "placeholder",
  "sample.vtt",
  "sample-subs",
  "dummy",
];

export function isDummySubtitleUrl(url?: string | null): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();
  return DUMMY_URL_MARKERS.some((marker) => lower.includes(marker));
}

const LANG_MAP: Record<string, string> = {
  en: "English",
  eng: "English",
  es: "Spanish",
  spa: "Spanish",
  pt: "Portuguese",
  por: "Portuguese",
  fr: "French",
  fra: "French",
  de: "German",
  ger: "German",
  it: "Italian",
  ita: "Italian",
  pl: "Polish",
  pol: "Polish",
  ar: "Arabic",
  ara: "Arabic",
  ru: "Russian",
  rus: "Russian",
  ja: "Japanese",
  jpn: "Japanese",
};

/** Canonical display label, so the same language dedupes to one entry. */
export function normaliseSubtitleLabel(sub: RawSubtitle): string {
  const raw = (sub.label || sub.language || "English")
    .replace(/\s*\((HD-\d+|Re:ANIME|Server Buzz|Flow|Yuri|Zuri|Buzz[^)]*)\)/gi, "")
    .trim();

  const mapped = LANG_MAP[raw.toLowerCase()] || raw;
  if (mapped.toLowerCase() === "english (dialogue)") return "English";
  return /[[(]|_\d+$/.test(mapped) ? prettySubtitleLabel(mapped) : capitalise(mapped);
}

const capitalise = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

/**
 * Release-style names → readable ones:
 *   "English (English Forced [Coalgirls])"          → "English · Coalgirls · Signs only"
 *   "Language (enm) (English [Honorific] [MTBB])"   → "English · MTBB · Honorifics"
 *   "Portuguese (Portuguese (BR) [Crunchyroll])"    → "Portuguese (BR) · Crunchyroll"
 *   "english (- (crunchyroll))"                     → "English · Crunchyroll"
 * A trailing "_1" (same release listed twice) is dropped so dedupe merges the pair.
 */
export function prettySubtitleLabel(raw: string): string {
  let s = raw.replace(/_\d+$/, "").replace(/^Language\s*\(\w+\)\s*/i, "");
  const bracketed = [...s.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1].trim());
  s = s.replace(/\[[^\]]*\]/g, " ");
  const forced = /\bforced\b/i.test(s);
  const words = s.replace(/[()-]/g, " ").split(/\s+/).filter((w) => w && !/^(forced|ocr)$/i.test(w));
  if (words.length === 0) return raw;

  const [first, ...rest] = words;
  const region = rest.find((w) => /^[A-Z]{2}$/.test(w));
  const others = rest.filter((w) => w.toLowerCase() !== first.toLowerCase() && w !== region);
  const numbers = others.filter((w) => /^\d+$/.test(w));
  const name = [capitalise(first), region && `(${region})`, ...numbers].filter(Boolean).join(" ");

  const isHonorific = (t: string) => /^honorifics?$/i.test(t);
  const sources = [...bracketed, ...others.filter((w) => !numbers.includes(w)).map(capitalise)].filter((t) => !isHonorific(t));
  const notes = [bracketed.some(isHonorific) && "Honorifics", forced && "Signs only"].filter(Boolean);
  return [name, ...sources, ...notes].join(" · ");
}

/**
 * Stable identity for a track within its scope.
 */
export function buildSubtitleScopeId(params: {
  serverKey: string;
  audioType: AudioTrackType;
  label: string;
  sourceId?: string;
}): string {
  const { serverKey, audioType, label, sourceId } = params;
  return [
    "sub",
    serverKey,
    audioType.toLowerCase(),
    sourceId ? sourceId.slice(-8) : "x",
    slug(label) || "track",
  ].join(":");
}

function tag(
  sub: RawSubtitle,
  owner: { serverKey: string; audioType: AudioTrackType; sourceId?: string },
  borrowed: boolean
): ScopedSubtitle | null {
  const rawUrl = sub.subtitleUrl || sub.url || sub.file || sub.link || "";
  const subtitleUrl = rawUrl.trim();
  if (!subtitleUrl || isDummySubtitleUrl(subtitleUrl)) return null;

  const label = normaliseSubtitleLabel(sub);
  return {
    id: buildSubtitleScopeId({ ...owner, label }),
    language: label,
    label,
    subtitleUrl,
    isDefault: sub.isDefault === true || sub.default === true,
    sourceId: owner.sourceId,
    serverKey: owner.serverKey,
    audioType: owner.audioType,
    borrowed,
    alternativeUrls: [],
  };
}

/** Merges same-label tracks inside one scope, keeping extra URLs as fallbacks. */
function dedupeWithinScope(tracks: ScopedSubtitle[]): ScopedSubtitle[] {
  const byLabel = new Map<string, ScopedSubtitle>();
  const result: ScopedSubtitle[] = [];

  for (const track of tracks) {
    const existing = byLabel.get(track.label);
    if (!existing) {
      byLabel.set(track.label, track);
      result.push(track);
      continue;
    }
    if (
      existing.serverKey === track.serverKey &&
      existing.audioType === track.audioType &&
      track.subtitleUrl !== existing.subtitleUrl &&
      !existing.alternativeUrls.includes(track.subtitleUrl)
    ) {
      existing.alternativeUrls.push(track.subtitleUrl);
    }
  }

  // Signs-only tracks last: releases list them first, and they carry no dialogue.
  return result.sort((a, b) => Number(isSignsOnly(a)) - Number(isSignsOnly(b)));
}

export const isSignsOnly = (t: { label?: string | null }) => !!t.label?.endsWith("Signs only");

/**
 * Builds the subtitle list for the source that is playing.
 */
export function collectScopedSubtitles(params: {
  currentSource?: ScopableSource | null;
  /** All sources of the episode, used only for same-server borrowing. */
  allSources?: Array<ScopableSource & { subtitles?: RawSubtitle[] | null }> | null;
  /** Tracks fetched from /api/play for the current server. */
  dynamicSubtitles?: RawSubtitle[] | null;
}): ScopedSubtitle[] {
  const { currentSource, allSources, dynamicSubtitles } = params;
  if (!currentSource) return [];

  const serverKey = getServerScopeKey(currentSource);
  const audioType = normaliseAudioType(currentSource.type);
  const sourceId = currentSource.id || undefined;

  const ownTracks: ScopedSubtitle[] = [];

  // 1. Tracks attached directly to the current source
  const srcSubs = (currentSource as any)?.subtitles;
  if (Array.isArray(srcSubs)) {
    for (const sub of srcSubs) {
      const tagged = tag(sub, { serverKey, audioType, sourceId }, false);
      if (tagged) ownTracks.push(tagged);
    }
  }

  // 2. Dynamic tracks fetched for this stream
  if (Array.isArray(dynamicSubtitles)) {
    for (const sub of dynamicSubtitles) {
      const tagged = tag(sub, { serverKey, audioType, sourceId }, false);
      if (tagged) ownTracks.push(tagged);
    }
  }

  const dedupedOwn = dedupeWithinScope(ownTracks);
  if (dedupedOwn.length > 0) return dedupedOwn;

  // 3. Fallback: If DUB has no captions of its own, borrow from the SUB stream of the same server
  if (audioType === "DUB" && Array.isArray(allSources)) {
    const subSource = allSources.find(
      (s) =>
        normaliseAudioType(s.type) === "SUB" &&
        getServerScopeKey(s) === serverKey
    );
    if (subSource && Array.isArray(subSource.subtitles)) {
      const borrowed: ScopedSubtitle[] = [];
      for (const sub of subSource.subtitles) {
        const tagged = tag(
          sub,
          { serverKey, audioType: "SUB", sourceId: subSource.id || undefined },
          true
        );
        if (tagged) borrowed.push(tagged);
      }
      const dedupedBorrowed = dedupeWithinScope(borrowed);
      if (dedupedBorrowed.length > 0) return dedupedBorrowed;
    }
  }

  // 4. Fallback: Any available subtitles from any source in the same server family
  if (Array.isArray(allSources)) {
    const sameServerSources = allSources.filter((s) => getServerScopeKey(s) === serverKey);
    for (const s of sameServerSources) {
      if (Array.isArray(s.subtitles) && s.subtitles.length > 0) {
        const borrowed: ScopedSubtitle[] = [];
        for (const sub of s.subtitles) {
          const tagged = tag(sub, { serverKey, audioType, sourceId: s.id || undefined }, true);
          if (tagged) borrowed.push(tagged);
        }
        const deduped = dedupeWithinScope(borrowed);
        if (deduped.length > 0) return deduped;
      }
    }
  }

  return [];
}
