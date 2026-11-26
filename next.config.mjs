/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  // Loaded by Node at runtime instead of bundled: @consumet/extensions require()s got-scraping,
  // which is ESM-only (exports has no "require" condition), so Turbopack can't resolve it.
  serverExternalPackages: ["@consumet/extensions", "got-scraping"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
