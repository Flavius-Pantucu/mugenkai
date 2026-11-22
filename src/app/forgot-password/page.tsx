import { getCatalog } from "@/server/catalog";
import { ForgotPasswordPage } from "@/views/PasswordResetPages";

export default async function Page() {
  const { anime } = await getCatalog();
  return <ForgotPasswordPage backdrop={anime[2]?.bannerImage ?? anime[0]?.bannerImage ?? ""} />;
}
