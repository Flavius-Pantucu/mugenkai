/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  // Loaded by Node at runtime instead of bundled: @consumet/extensions require()s got-scraping,
  // which is ESM-only (exports has no "require" condition), so Turbopack can't resolve it.
  serverExternalPackages: ["@consumet/extensions", "got-scraping"],
};

export default nextConfig;
