import Link from "next/link";
import { BookOpen, Play, Star } from "lucide-react";
import type { MediaRef, SeriesDetails } from "@/server/details";
import { ContentRow } from "./ContentRow";

// Detail-page sections from AniList, below the episode/chapter grid. Rendered on the server.

const FORMAT: Record<string, string> = { TV: "TV", ONA: "ONA", MOVIE: "Movie", OVA: "OVA", MANGA: "Manga", ONE_SHOT: "One shot" };

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-white" style={{ fontFamily: "var(--font-family-heading)", fontSize: "clamp(1.05rem, 1.6vw, 1.3rem)", fontWeight: 700 }}>
      {children}
    </h2>
  );
}

function RefCard({ item }: { item: MediaRef }) {
  return (
    <Link href={`/${item.kind}/${item.id}`} className="group block w-[132px] sm:w-[150px]">
      <span className="block aspect-[2/3] overflow-hidden rounded-lg ring-1 ring-white/10 transition-shadow group-hover:ring-white/30">
        <img src={item.cover} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
      </span>
      <span className="mt-2 line-clamp-2 text-[13.5px] font-bold leading-snug text-white">{item.title}</span>
      <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted-foreground">
        {item.rating !== null && (
          <span className="inline-flex items-center gap-0.5">
            <Star className="size-3 fill-coral-400 text-coral-400" />
            {item.rating.toFixed(1)}
          </span>
        )}
        {item.format && FORMAT[item.format]}
      </span>
    </Link>
  );
}

export function SeriesExtras({ kind, details, trailerYoutubeId }: { kind: "anime" | "manga"; details: SeriesDetails; trailerYoutubeId?: string | null }) {
  const { adaptations, characters, recommendations } = details;
  const AdaptIcon = kind === "anime" ? BookOpen : Play;
  return (
    <>
      {adaptations.length > 0 && (
        <section className="mt-14">
          <Heading>{kind === "anime" ? "Read the manga" : "Watch the anime"}</Heading>
          <div className="flex flex-wrap gap-3">
            {adaptations.map((a) => (
              <Link
                key={a.id}
                href={`/${a.kind}/${a.id}`}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-raised p-2 pr-4 transition-colors hover:border-white/25"
              >
                <img src={a.cover} alt="" loading="lazy" className="h-16 w-11 rounded object-cover" />
                <span>
                  <span className="block text-[14px] font-bold text-white">{a.title}</span>
                  <span className="mt-0.5 inline-flex items-center gap-1 text-[12.5px] text-lagoon-300">
                    <AdaptIcon className="size-3.5" />
                    {kind === "anime" ? "Continue the story in the manga" : "See it animated"}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {trailerYoutubeId && (
        <section className="mt-14 max-w-3xl">
          <Heading>Trailer</Heading>
          <div className="aspect-video overflow-hidden rounded-xl ring-1 ring-white/10">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailerYoutubeId}`}
              title="Trailer"
              loading="lazy"
              allow="encrypted-media; picture-in-picture; fullscreen"
              className="h-full w-full"
            />
          </div>
        </section>
      )}

      {characters.length > 0 && (
        <section className="mt-14">
          <Heading>Characters</Heading>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {characters.map((c) => (
              <li key={c.image + c.name} className="flex items-center gap-3 rounded-xl bg-ink-raised p-2 pr-3">
                <img src={c.image} alt="" loading="lazy" className="size-14 rounded-lg object-cover" />
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-bold text-white">{c.name}</span>
                  <span className="block truncate text-[12.5px] text-muted-foreground">
                    {c.role === "MAIN" ? "Main" : "Supporting"}
                    {c.voiceActor && ` · ${c.voiceActor}`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recommendations.length > 0 && (
        // ContentRow centers itself at 90%; cancel that inside <main>, which already is.
        <section className="mt-14 [&>div]:w-full">
          <ContentRow title="Fans also liked" subtitle="Recommended by AniList users">
            {recommendations.map((r) => (
              <RefCard key={r.id} item={r} />
            ))}
          </ContentRow>
        </section>
      )}
    </>
  );
}
