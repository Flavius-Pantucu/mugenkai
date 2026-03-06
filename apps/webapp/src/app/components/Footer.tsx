import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="bg-[#06060a] border-t border-purple-500/5 mt-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                <span className="text-white" style={{ fontSize: "14px", fontWeight: 800 }}>M</span>
              </div>
              <span
                className="text-white tracking-wider"
                style={{ fontFamily: "var(--font-family-heading)", fontSize: "16px", fontWeight: 700 }}
              >
                MUGENKAI
              </span>
            </div>
            <p className="text-zinc-500" style={{ fontSize: "13px", lineHeight: 1.6 }}>
              Your gateway to limitless anime and manga. Stream, read, and discover stories that move you.
            </p>
          </div>

          <div>
            <h4
              className="text-zinc-300 mb-3"
              style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.05em" }}
            >
              BROWSE
            </h4>
            <ul className="space-y-2">
              {["Trending", "Popular", "New Releases", "Genres"].map((item) => (
                <li key={item}>
                  <Link
                    to="/home"
                    className="text-zinc-500 hover:text-purple-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className="text-zinc-300 mb-3"
              style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.05em" }}
            >
              SUPPORT
            </h4>
            <ul className="space-y-2">
              {["Help Center", "Contact Us", "FAQ", "Status"].map((item) => (
                <li key={item}>
                  <span
                    className="text-zinc-500 hover:text-purple-400 transition-colors cursor-pointer"
                    style={{ fontSize: "13px" }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className="text-zinc-300 mb-3"
              style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.05em" }}
            >
              LEGAL
            </h4>
            <ul className="space-y-2">
              {["Terms", "Privacy", "Cookies", "DMCA"].map((item) => (
                <li key={item}>
                  <span
                    className="text-zinc-500 hover:text-purple-400 transition-colors cursor-pointer"
                    style={{ fontSize: "13px" }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-zinc-600" style={{ fontSize: "12px" }}>
            2026 Mugenkai. All rights reserved. Built with boundless imagination.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-zinc-600 hover:text-purple-400 cursor-pointer transition-colors" style={{ fontSize: "12px" }}>
              Twitter
            </span>
            <span className="text-zinc-600 hover:text-purple-400 cursor-pointer transition-colors" style={{ fontSize: "12px" }}>
              Discord
            </span>
            <span className="text-zinc-600 hover:text-purple-400 cursor-pointer transition-colors" style={{ fontSize: "12px" }}>
              GitHub
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
