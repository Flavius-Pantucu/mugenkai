import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { getSiteConfig } from "@/server/site-config";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const cfg = await getSiteConfig();
  return (
    <div className="min-h-screen bg-ink pt-24">
      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-16 sm:px-6">
        <h1 className="text-3xl font-bold text-white">About {cfg.siteName}</h1>
        <p className="leading-relaxed text-zinc-300">{cfg.tagline}</p>
        <p className="leading-relaxed text-zinc-400">
          {cfg.siteName} brings together anime streaming, manga reading, personal watchlists, and episode/chapter progress tracking in a single fast interface.
        </p>
      </div>
      <Footer />
    </div>
  );
}
