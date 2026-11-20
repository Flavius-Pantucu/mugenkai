import { getCatalog } from "@/server/catalog";
import { AnimePage } from "@/views/AnimePage";

export default async function Page() {
  return <AnimePage items={(await getCatalog()).anime} />;
}
