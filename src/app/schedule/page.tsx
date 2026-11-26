import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { WeeklySchedule } from "@/components/WeeklySchedule";
import { getCatalog } from "@/server/catalog";
import { getWeekSchedule } from "@/server/schedule";

export const metadata: Metadata = { title: "Schedule — Mugenkai" };

export default async function SchedulePage() {
  const catalog = await getCatalog();
  const schedule = await getWeekSchedule(catalog);

  return (
    <div className="min-h-screen bg-ink pt-24">
      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Weekly Release Schedule</h1>
          <p className="mt-2 text-sm text-zinc-400">Upcoming airing episodes synced with AniList.</p>
        </header>
        <WeeklySchedule entries={schedule} />
      </div>
      <Footer />
    </div>
  );
}
