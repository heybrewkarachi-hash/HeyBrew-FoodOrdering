import {
  BaristaLineArt,
  CafeLineArt,
  CheckerboardAccent,
} from "@/components/decorations/brand-art";

export function PromoStrip() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-3 md:px-6 md:pt-3">
      <div className="relative flex items-center justify-center gap-3 overflow-hidden rounded-pill bg-surface px-4 py-2.5 md:gap-6 md:px-8 md:py-3">
        <CheckerboardAccent className="absolute left-2 top-1/2 hidden h-6 w-6 -translate-y-1/2 sm:block" />
        <BaristaLineArt className="hidden h-9 w-auto shrink-0 sm:block" />
        <p className="text-center font-display text-sm font-extrabold text-espresso md:text-lg">
          Freshly brewed. Made for you.
        </p>
        <CafeLineArt className="hidden h-9 w-auto shrink-0 sm:block" />
        <CheckerboardAccent className="absolute right-2 top-1/2 hidden h-6 w-6 -translate-y-1/2 sm:block" />
      </div>
    </div>
  );
}
