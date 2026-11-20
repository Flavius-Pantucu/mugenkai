import { getCatalog } from "@/server/catalog";
import { RegisterPage } from "@/views/RegisterPage";

export default async function Page() {
  const { anime } = await getCatalog();
  return <RegisterPage backdrop={anime[4]?.bannerImage ?? anime[0]?.bannerImage ?? ""} />;
}
