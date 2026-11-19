import { getHello } from "@/services/manga";

export function GET() {
  return Response.json(getHello());
}
