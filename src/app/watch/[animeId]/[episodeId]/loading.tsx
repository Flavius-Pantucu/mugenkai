import { LogoMark } from "@/components/Logo";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink">
      <div className="flex flex-col items-center gap-3">
        <span className="relative grid size-14 place-items-center">
          <span className="absolute inset-0 rounded-full border-2 border-white/10 border-t-primary motion-safe:animate-spin" />
          <LogoMark className="h-6 w-8 opacity-90" />
        </span>
        <p className="text-xs font-medium tracking-wide text-zinc-400">Loading player…</p>
      </div>
    </div>
  );
}
