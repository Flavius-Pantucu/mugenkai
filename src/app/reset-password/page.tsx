import { getCatalog } from "@/server/catalog";
import { ResetPasswordPage } from "@/views/PasswordResetPages";

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const [{ anime }, { token }] = await Promise.all([getCatalog(), searchParams]);
  return <ResetPasswordPage backdrop={anime[3]?.bannerImage ?? anime[0]?.bannerImage ?? ""} token={typeof token === "string" ? token : ""} />;
}
