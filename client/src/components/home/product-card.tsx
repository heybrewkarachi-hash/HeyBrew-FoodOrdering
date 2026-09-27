"use client";

import Image from "next/image";
import { formatRs } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useUi } from "@/context/ui-context";
import { cn } from "@/lib/cn";

type Props = {
  product: Product;
  className?: string;
};

/** Compact Sugar Latte–style card: text left, image right — sized for 2×2 (4 on screen) */
export function ProductCard({ product, className }: Props) {
  const { openProduct } = useUi();

  return (
    <button
      type="button"
      onClick={() => openProduct(product)}
      className={cn(
        "flex w-full items-stretch gap-3 rounded-[1.15rem] bg-white p-3 text-left shadow-[0_2px_12px_rgba(60,30,24,0.07)] transition hover:shadow-[0_4px_18px_rgba(60,30,24,0.11)] active:scale-[0.99] sm:gap-3.5 sm:rounded-2xl sm:p-3.5",
        className
      )}
      aria-label={`${product.name}, ${formatRs(product.basePriceMinor)}`}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5 py-0.5">
        <div className="space-y-1">
          <h3 className="font-display text-[15px] font-extrabold leading-snug text-espresso line-clamp-2 sm:text-base">
            {product.name}
          </h3>
          <p className="line-clamp-2 text-[11px] leading-snug text-muted sm:text-xs">
            {product.description}
          </p>
        </div>
        <p className="font-display text-[15px] font-extrabold text-espresso sm:text-base">
          {formatRs(product.basePriceMinor)}
        </p>
      </div>

      <div className="relative h-[5.75rem] w-[5.75rem] shrink-0 overflow-hidden rounded-xl bg-surface sm:h-[6.5rem] sm:w-[6.5rem] sm:rounded-[1.05rem]">
        <Image
          src={product.imageUrl}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 640px) 92px, 104px"
        />
      </div>
    </button>
  );
}
