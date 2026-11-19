import { getHello } from "@/services/auth";

export function GET() {
  return Response.json(getHello());
}
