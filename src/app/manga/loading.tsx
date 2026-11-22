export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
        <div className="h-9 w-40 rounded-lg bg-ink-raised/70 animate-pulse" />
        <div className="h-4 w-64 rounded bg-ink-raised/40 animate-pulse" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-[2/3] w-full rounded-xl bg-ink-raised/50 ring-1 ring-white/5 animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-ink-raised/50 animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-ink-raised/30 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
