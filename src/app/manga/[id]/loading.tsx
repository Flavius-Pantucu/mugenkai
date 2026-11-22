import { LogoMark } from "@/components/Logo";

export default function Loading() {
  return (
    <div className="relative min-h-screen bg-ink">
      {/* Backdrop skeleton */}
      <div className="relative h-[45vh] w-full overflow-hidden bg-ink-raised/40 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
      </div>

      {/* Floating Center Indicator */}
      <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-ink-raised/90 p-6 shadow-2xl backdrop-blur-md ring-1 ring-white/10 pointer-events-auto">
          <span className="relative grid size-14 place-items-center">
            <span className="absolute inset-0 rounded-full border-2 border-white/10 border-t-primary motion-safe:animate-spin" />
            <LogoMark className="h-6 w-8 opacity-90" />
          </span>
          <p className="text-xs font-medium tracking-wide text-zinc-300">Loading manga & chapters…</p>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="relative z-10 mx-auto -mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="h-72 w-48 shrink-0 rounded-xl bg-ink-raised/60 ring-1 ring-white/5 animate-pulse" />
          <div className="flex-1 space-y-4 pt-6">
            <div className="h-8 w-2/3 rounded-lg bg-ink-raised/60 animate-pulse" />
            <div className="h-4 w-1/3 rounded bg-ink-raised/40 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-6 w-16 rounded-md bg-ink-raised/40 animate-pulse" />
              <div className="h-6 w-16 rounded-md bg-ink-raised/40 animate-pulse" />
              <div className="h-6 w-16 rounded-md bg-ink-raised/40 animate-pulse" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-3.5 w-full rounded bg-ink-raised/30 animate-pulse" />
              <div className="h-3.5 w-5/6 rounded bg-ink-raised/30 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
