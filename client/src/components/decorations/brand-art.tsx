import { cn } from "@/lib/cn";

/** Decorative 2×2 checkerboard accent used throughout the brand. */
export function CheckerboardAccent({
  className,
  tone = "espresso",
}: {
  className?: string;
  tone?: "espresso" | "cream";
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "grid h-6 w-6 grid-cols-2 grid-rows-2 overflow-hidden rounded-sm",
        className
      )}
    >
      <span
        className={tone === "espresso" ? "bg-espresso" : "bg-cream"}
      />
      <span
        className={tone === "espresso" ? "bg-surface" : "bg-espresso/40"}
      />
      <span
        className={tone === "espresso" ? "bg-surface" : "bg-espresso/40"}
      />
      <span
        className={tone === "espresso" ? "bg-espresso" : "bg-cream"}
      />
    </div>
  );
}

export function BaristaLineArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 64"
      className={cn("h-12 w-16 text-espresso", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M28 48c-6-2-10-8-10-16 0-10 8-18 18-18s18 8 18 18c0 8-4 14-10 16" />
      <path d="M36 18c2-6 8-10 14-8" />
      <path d="M42 34c4 0 8 2 10 6" />
      <path d="M22 34h-6c-2 0-4 2-4 4v2c0 4 4 8 12 8" />
      <path d="M48 48h8" />
      <circle cx="40" cy="28" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CafeLineArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 64"
      className={cn("h-12 w-16 text-espresso", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M12 52V24l28-12 28 12v28" />
      <path d="M20 52V32h16v20" />
      <path d="M44 52V36h16v16" />
      <path d="M28 40h4M52 42h4" />
      <path d="M12 52h56" />
    </svg>
  );
}
