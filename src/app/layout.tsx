import type { Metadata, Viewport } from "next";
import "@/styles/index.css";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { CustomCursor } from "@/components/CustomCursor";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { searchIndex } from "@/data/series";
import { getCatalog } from "@/server/catalog";

// Android: the keyboard shrinks the layout instead of covering it (iOS ignores this; search pins to the top).
export const viewport: Viewport = { interactiveWidget: "resizes-content", themeColor: "#061013" };

const description = "Watch anime and read manga, all in one place. Track every episode and chapter you finish.";

// Icons and the link-preview image come from app/icon.svg, apple-icon.tsx and opengraph-image.tsx.
export const metadata: Metadata = {
  title: "Mugenkai",
  description,
  openGraph: { title: "Mugenkai", description, siteName: "Mugenkai", type: "website" },
  twitter: { card: "summary_large_image", title: "Mugenkai", description },
  // Installed on an iPhone home screen: opens without browser chrome, dark status bar.
  appleWebApp: { capable: true, title: "Mugenkai", statusBarStyle: "black" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { anime, manga } = await getCatalog();
  return (
    <html lang="en" className="dark">
      <body>
        <AuthProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-ink">
              <CustomCursor />
              <Navbar searchIndex={searchIndex(anime, manga)} />
              <main>{children}</main>
            </div>
            <Toaster position="bottom-right" />
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
