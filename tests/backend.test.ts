// Self-check for the logic most likely to break silently. Run: pnpm test
// Node strips the types itself (no test framework); imports use explicit .ts paths for that reason.
import assert from "node:assert/strict";
import { test } from "node:test";
import { episodeId, parseChapterId, parseEpisodeId, similarTo } from "../src/data/series.ts";
import { hashPassword, verifyPassword } from "../src/server/password.ts";
import { airedEpisodes, assignStreamingEpisodes, dropBulkDates, cleanDescription, parseChapterNumber, parseStreamingTitle, pickChapters, type MdChapter } from "../src/server/sync/parse.ts";

test("AniList streaming titles map to episode number and title", () => {
  assert.deepEqual(parseStreamingTitle("Episode 12 - The Hero's Return"), { number: 12, title: "The Hero's Return" });
  assert.deepEqual(parseStreamingTitle("Episode 3: Night"), { number: 3, title: "Night" });
  assert.equal(parseStreamingTitle("Special: Recap"), null);
  assert.equal(parseStreamingTitle("Episode 0 - Prologue"), null);
  assert.equal(parseStreamingTitle(null), null);
});

test("sequels don't take the first season's streaming episodes", () => {
  const ep = (n: number, t: string) => ({ title: `Episode ${n} - ${t}`, thumbnail: `${t}.jpg`, url: `https://cr/${t}`, site: "Crunchyroll" });
  const s1 = [ep(1, "Cruelty"), ep(2, "Trainer")];
  const [a, b, c] = assignStreamingEpisodes([
    { episodeCount: 2, streamingEpisodes: s1 },
    { episodeCount: 2, streamingEpisodes: s1 }, // AniList repeats S1's feed
    { episodeCount: 2, streamingEpisodes: [...s1, ep(3, "Train"), ep(4, "Flame")] }, // continues the numbering
  ]);
  assert.deepEqual(a.map((e) => [e.number, e.title]), [[1, "Cruelty"], [2, "Trainer"]]);
  assert.deepEqual(b, []);
  assert.deepEqual(c.map((e) => [e.number, e.title]), [[1, "Train"], [2, "Flame"]]);
});

test("aired episode count follows the airing schedule", () => {
  assert.equal(airedEpisodes({ status: "FINISHED", episodes: 24, nextAiringEpisode: null }), 24);
  assert.equal(airedEpisodes({ status: "RELEASING", episodes: 24, nextAiringEpisode: { episode: 8 } }), 7);
  assert.equal(airedEpisodes({ status: "RELEASING", episodes: null, nextAiringEpisode: { episode: 1 } }), 1);
  assert.equal(airedEpisodes({ status: "FINISHED", episodes: null, nextAiringEpisode: null }), 12);
});

test("descriptions lose HTML and source credits", () => {
  assert.equal(cleanDescription("A <i>great</i> story.<br><br>(Source: Crunchyroll)"), "A great story.");
});

test("MangaDex chapters: one per number, hosted pages beat external links, sorted", () => {
  const ch = (id: string, chapter: string | null, pages: number, externalUrl: string | null = null): MdChapter => ({
    id,
    attributes: { chapter, title: null, pages, externalUrl, publishAt: "2026-01-01T00:00:00Z" },
    relationships: [],
  });
  const picked = pickChapters([ch("a", "2", 0, "https://mangaplus.example/2"), ch("b", "1", 20), ch("c", "2", 18), ch("d", null, 5), ch("e", "10.5", 12)]);
  assert.deepEqual(
    picked.map(([n, c]) => [n, c.id]),
    [
      [1, "b"],
      [2, "c"],
      [10.5, "e"],
    ],
  );
});

test("episode and chapter ids round-trip", () => {
  assert.deepEqual(parseEpisodeId(episodeId("16498", 2, 7)), { animeId: "16498", season: 2, number: 7 });
  assert.deepEqual(parseChapterId("30013-ch-10.5"), { mangaId: "30013", number: 10.5 });
  assert.equal(parseEpisodeId("nonsense"), null);
});

test("password hashes verify, reject wrong passwords, and are salted", async () => {
  const hash = await hashPassword("Correct-Horse-1");
  assert.ok(await verifyPassword("Correct-Horse-1", hash));
  assert.ok(!(await verifyPassword("correct-horse-1", hash)));
  assert.notEqual(hash, await hashPassword("Correct-Horse-1"));
  assert.ok(!(await verifyPassword("x", "not-a-hash")));
});

test("recommendations share genres, skip seen titles, rank by overlap then rating", () => {
  const t = (id: string, genres: string[], rating: number) => ({ id, genres, rating });
  const seed = t("seed", ["Action", "Fantasy", "Drama"], 8);
  const pool = [seed, t("a", ["Action", "Fantasy"], 7), t("b", ["Action", "Fantasy", "Drama"], 6), t("c", ["Action"], 9), t("d", ["Action", "Drama"], 8.5), t("seen", ["Action", "Fantasy", "Drama"], 9)];
  assert.deepEqual(
    similarTo(seed, pool, new Set(["seen"])).map((x) => x.id),
    ["b", "d", "a"],
  );
});

test("release-style subtitle names become readable labels", async () => {
  const { normaliseSubtitleLabel: n } = await import("../src/components/player/player-core/subtitle-scope.ts");
  assert.equal(n({ label: "English (English [Crunchyroll])" }), "English · Crunchyroll");
  assert.equal(n({ label: "English (English Forced [Coalgirls])" }), "English · Coalgirls · Signs only");
  assert.equal(n({ label: "English (English [USBD] (OCR))_1" }), "English · USBD");
  assert.equal(n({ label: "Language (enm) (English [Honorific] [MTBB])" }), "English · MTBB · Honorifics");
  assert.equal(n({ label: "Portuguese (Portuguese (BR) [Crunchyroll])" }), "Portuguese (BR) · Crunchyroll");
  assert.equal(n({ label: "English (English [Crunchyroll TL + Baal/SCY TS])" }), "English · Crunchyroll TL + Baal/SCY TS");
  assert.equal(n({ label: "english (- (crunchyroll))" }), "English · Crunchyroll");
  assert.equal(n({ label: "English 2" }), "English 2");
  assert.equal(n({ label: "spanish" }), "Spanish");
  assert.equal(n({ language: "eng" }), "English");
});

test("parseChapterNumber extracts chapter numbers accurately", () => {
  assert.equal(parseChapterNumber("Chapter 1052.5"), 1052.5);
  assert.equal(parseChapterNumber("one-piece-chapter-1100"), 1100);
  assert.equal(parseChapterNumber("4143-10143000/spy-x-family-chapter-143"), 143);
  assert.equal(parseChapterNumber("Chapter 14", 0), 14);
  assert.equal(parseChapterNumber(99), 99);
});

test("bulk-uploaded chapter dates are dropped, real ones kept", () => {
  const bulk = "2024-09-07T17:04:15.717Z";
  const out = dropBulkDates([
    { n: 1, releasedAt: bulk },
    { n: 2, releasedAt: bulk },
    { n: 3, releasedAt: bulk },
    { n: 385, releasedAt: "2026-06-25T15:46:45.598Z" },
    { n: 386, releasedAt: null },
  ]);
  assert.deepEqual(out.map((c) => c.releasedAt), [null, null, null, "2026-06-25T15:46:45.598Z", null]);
});
