import { NextResponse, type NextRequest } from "next/server";

const MAX_API_BODY_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Next.js 16 request proxy: enforces payload size bounds on API routes and attaches
 * baseline security headers across the site.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_API_BODY_BYTES) {
      return NextResponse.json({ error: "payload_too_large", message: "Request body exceeds 2 MB limit" }, { status: 413 });
    }
  }

  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
