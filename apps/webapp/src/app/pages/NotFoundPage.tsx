import { Link } from "react-router";
import { Home } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center pt-16">
      <div className="text-center px-4">
        <h1
          className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400 mb-4"
          style={{
            fontFamily: "var(--font-family-heading)",
            fontSize: "clamp(4rem, 10vw, 8rem)",
            fontWeight: 900,
            lineHeight: 1,
          }}
        >
          404
        </h1>
        <p className="text-zinc-400 mb-8" style={{ fontSize: "18px" }}>
          This page has vanished into another dimension.
        </p>
        <Link
          to="/home"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:from-purple-500 hover:to-violet-500 transition-all shadow-lg shadow-purple-500/20"
          style={{ fontSize: "14px", fontWeight: 600 }}
        >
          <Home size={18} /> Back to Home
        </Link>
      </div>
    </div>
  );
}
