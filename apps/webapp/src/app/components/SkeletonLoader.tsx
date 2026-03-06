export function CardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[180px] sm:w-[200px]">
      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-[#14141f] animate-pulse relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent skeleton-shimmer" />
      </div>
    </div>
  );
}

export function BannerSkeleton() {
  return (
    <div className="relative w-full h-[85vh] min-h-[500px] max-h-[900px] bg-[#0c0c14] animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/2 to-transparent skeleton-shimmer" />
      <div className="absolute bottom-20 left-8 space-y-4">
        <div className="w-16 h-6 rounded-full bg-white/5" />
        <div className="w-96 h-12 rounded-lg bg-white/5" />
        <div className="w-64 h-4 rounded bg-white/5" />
        <div className="w-80 h-4 rounded bg-white/5" />
        <div className="flex gap-3 mt-6">
          <div className="w-36 h-12 rounded-xl bg-white/5" />
          <div className="w-36 h-12 rounded-xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="py-4 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 rounded-full bg-purple-500/20" />
        <div className="w-40 h-6 rounded bg-white/5" />
      </div>
      <div className="flex gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#09090b]">
      <BannerSkeleton />
      <div className="space-y-8 py-8">
        <RowSkeleton />
        <RowSkeleton />
        <RowSkeleton />
      </div>
    </div>
  );
}
