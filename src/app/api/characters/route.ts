import { getSeriesDetails } from "@/server/details";
import { json, route } from "@/server/http";

/** Character portraits for one series, for the avatar picker. */
export const GET = route(async (req: Request) => {
  const id = new URL(req.url).searchParams.get("series") ?? "";
  const { characters } = await getSeriesDetails(id);
  return json({ characters: characters.map((c) => ({ name: c.name, image: c.imageLarge })) });
});
