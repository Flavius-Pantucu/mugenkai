import type { Metadata } from "next";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = { title: "DMCA" };

export default function DmcaPage() {
  return (
    <div className="min-h-screen bg-ink pt-24">
      <div className="mx-auto max-w-3xl space-y-5 px-4 pb-16 text-sm leading-relaxed text-zinc-300 sm:px-6">
        <h1 className="text-3xl font-bold text-white">DMCA &amp; Copyright Policy</h1>
        <p>
          Mugenkai respects the intellectual property rights of creators and rights holders. Metadata and artwork are indexed from public catalog APIs, and
          external streams or chapters are linked from third-party providers.
        </p>
        <p className="text-zinc-400">
          If you believe any content accessible through this site infringes your copyright, please contact the site administrator with the exact URLs and proof of
          ownership so we can review and remove the material promptly.
        </p>
      </div>
      <Footer />
    </div>
  );
}
