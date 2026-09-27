"use client";

import Link from "next/link";
import { formatRs } from "@/lib/format";
import { useCart } from "@/context/cart-context";
import { IconArrowRight, IconCart } from "@/components/ui/icons";

export function StickyCartBar() {
  const { itemCount, validated, setDrawerOpen, items } = useCart();

  if (!itemCount) return null;

  const total =
    validated?.grandTotalMinor ??
    items.reduce((s, i) => s + i.unitPriceMinor * i.quantity, 0);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-espresso/10 bg-cream/95 px-4 py-3 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex min-h-touch flex-1 items-center justify-between rounded-pill bg-espresso px-5 py-3 text-cream"
        >
          <span className="inline-flex items-center gap-2 font-display font-bold">
            <IconCart className="h-5 w-5" />
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </span>
          <span className="font-display font-bold">{formatRs(total)}</span>
        </button>
        <Link
          href="/checkout"
          className="inline-flex min-h-touch items-center gap-1 rounded-pill bg-surface px-4 py-3 font-display text-sm font-bold text-espresso"
        >
          Checkout
          <IconArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
