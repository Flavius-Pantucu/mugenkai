import { getCatalog } from "@/server/catalog";
import { LoginPage } from "@/views/LoginPage";

export default async function Page() {
  const { anime } = await getCatalog();
  return <LoginPage backdrop={anime[1]?.bannerImage ?? anime[0]?.bannerImage ?? ""} />;
}
