import { getCatalog } from "@/server/catalog";
import { getWeekSchedule } from "@/server/schedule";
import { getTrending } from "@/server/trending";
import { HomePage } from "@/views/HomePage";

export default async function Page() {
  const catalog = await getCatalog();
  const [schedule, trending] = await Promise.all([getWeekSchedule(catalog), getTrending(catalog)]);
  return <HomePage anime={catalog.anime} manga={catalog.manga} schedule={schedule} trending={trending} />;
}
