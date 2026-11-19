import { useId } from "react";

/** Mugenkai infinity mark. Size it with className (width/height). */
export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="4 6 40 28" className={className} role="img" aria-label="Mugenkai">
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2ec4b6" />
          <stop offset="50%" stopColor="#5fd9cc" />
          <stop offset="100%" stopColor="#9cebe1" />
        </linearGradient>
      </defs>
      <path
        d="M 8 20 C 8 14 12 10 16 10 C 20 10 22 14 24 20 C 26 26 28 30 32 30 C 36 30 40 26 40 20 C 40 14 36 10 32 10 C 28 10 26 14 24 20 C 22 26 20 30 16 30 C 12 30 8 26 8 20 Z"
        fill={`url(#${id})`}
      />
    </svg>
  );
}
