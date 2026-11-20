import { getCatalog } from "@/server/catalog";
import { ProfilePage } from "@/views/ProfilePage";

export default async function Page() {
  const { anime, manga } = await getCatalog();
  return <ProfilePage anime={anime} manga={manga} />;
}
