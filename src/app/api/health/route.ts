import * as auth from "@/services/auth";
import * as user from "@/services/user";
import * as anime from "@/services/anime";
import * as manga from "@/services/manga";

export function GET() {
  return Response.json({ status: "ok", services: [auth, user, anime, manga].map((s) => s.getHello()) });
}
