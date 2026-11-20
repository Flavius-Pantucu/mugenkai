import { destroySession } from "@/server/auth";
import { assertSameOrigin, json, route } from "@/server/http";

export const POST = route(async (req: Request) => {
  assertSameOrigin(req);
  await destroySession();
  return json({ ok: true });
});
