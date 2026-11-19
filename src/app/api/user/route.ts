import { getHello } from "@/services/user";

export function GET() {
  return Response.json(getHello());
}
