import type { Metadata } from "next";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-ink pt-24">
      <div className="mx-auto max-w-3xl space-y-5 px-4 pb-16 text-sm leading-relaxed text-zinc-300 sm:px-6">
        <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
        <p>
          By using this platform, you agree not to abuse API endpoints, bypass rate limits, post spam or unmarked spoilers, or harass other members of the
          community.
        </p>
        <p className="text-zinc-400">Administrators reserve the right to mute or suspend accounts that violate these guidelines.</p>
      </div>
      <Footer />
    </div>
  );
}
