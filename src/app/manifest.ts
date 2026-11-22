import type { MetadataRoute } from "next";

// Makes the site installable ("Add to Home Screen") and open full-screen like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mugenkai",
    short_name: "Mugenkai",
    description: "Stream anime and read manga, with one history of what you watched and read.",
    start_url: "/",
    display: "standalone",
    background_color: "#061013",
    theme_color: "#061013",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
