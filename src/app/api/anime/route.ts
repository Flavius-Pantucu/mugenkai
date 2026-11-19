import { getHello } from "@/services/anime";

export function GET() {
  return Response.json(getHello());
}
