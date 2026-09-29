"use client";

import { usePathname } from "next/navigation";
import { formatRs } from "@/lib/format";
import { useCart } from "@/context/cart-context";
import { IconArrowRight } from "@/components/ui/icons";

/** Mobile cart shortcut — hidden on checkout (checkout has its own place-order bar). */
export function StickyCartBar() {
  const pathname = usePathname();
  const { itemCount, validated, setDrawerOpen, items, drawerOpen } = useCart();

  if (!itemCount) return null;
  if (drawerOpen) return null;
  if (pathname?.startsWith("/checkout")) return null;

  const total =
    validated?.grandTotalMinor ??
    items.reduce((s, i) => s + i.unitPriceMinor * i.quantity, 0);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 px-3 pt-2 md:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label={`View cart, ${itemCount} items, ${formatRs(total)}`}
        className="mx-auto flex w-full max-w-lg min-h-[3.25rem] items-center gap-3 rounded-[1.25rem] bg-espresso px-3.5 py-2.5 text-cream shadow-[0_8px_28px_rgba(45,24,16,0.35)]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream font-display text-sm font-extrabold text-espresso tabular-nums">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
        <span className="flex-1 text-center font-display text-base font-bold tracking-wide">
          View Cart
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 font-display text-sm font-bold tabular-nums">
          {formatRs(total)}
          <IconArrowRight className="h-4 w-4" />
        </span>
      </button>
    </div>
  );
}
