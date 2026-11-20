import { getCurrentUser, toProfile } from "@/server/auth";
import { backendEnabled } from "@/server/env";
import { json, route } from "@/server/http";

/** Who is signed in, and whether the app runs against a database (false = demo mode). */
export const GET = route(async () => {
  if (!backendEnabled) return json({ backend: false, user: null });
  const user = await getCurrentUser();
  return json({ backend: true, user: user ? toProfile(user) : null });
});
