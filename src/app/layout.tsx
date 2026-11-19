import type { Metadata } from "next";
import "@/styles/index.css";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { CustomCursor } from "@/components/CustomCursor";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = { title: "Mugenkai", icons: "/favicon.svg" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <AuthProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-ink">
              <CustomCursor />
              <Navbar />
              <main>{children}</main>
            </div>
            <Toaster position="bottom-right" />
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
