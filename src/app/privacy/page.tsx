import type { Metadata } from "next";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-ink pt-24">
      <div className="mx-auto max-w-3xl space-y-5 px-4 pb-16 text-sm leading-relaxed text-zinc-300 sm:px-6">
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <p>
          We store only the information required to operate your account: your email address, username, hashed password, watchlist entries, watch/read progress,
          and comments you choose to post.
        </p>
        <p className="text-zinc-400">
          Session tokens are stored in HttpOnly cookies and hashed in our database. We do not sell personal data or share it with third-party advertisers.
        </p>
      </div>
      <Footer />
    </div>
  );
}
