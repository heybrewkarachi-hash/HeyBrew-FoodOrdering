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

/**
 * Sugar Latte–style product tile:
 * full-width 2-col grid, large horizontal card (text ~60% / image ~40%).
 */
export function ProductCard({ product, className }: Props) {
  const { openProduct } = useUi();

  return (
    <button
      type="button"
      onClick={() => openProduct(product)}
      className={cn(
        "flex w-full min-h-[8.75rem] items-stretch gap-3 rounded-2xl bg-white p-3 text-left",
        "shadow-[0_2px_14px_rgba(60,30,24,0.08)] transition",
        "hover:shadow-[0_6px_20px_rgba(60,30,24,0.12)] active:scale-[0.995]",
        "sm:min-h-[10rem] sm:gap-4 sm:rounded-[1.25rem] sm:p-4",
        className
      )}
      aria-label={`${product.name}, ${formatRs(product.basePriceMinor)}`}
    >
      <div className="flex min-w-0 flex-[1.35] flex-col justify-between gap-2 py-0.5">
        <div className="space-y-1.5">
          <h3 className="font-display text-base font-extrabold leading-tight text-espresso line-clamp-2 sm:text-lg">
            {product.name}
          </h3>
          <p className="line-clamp-2 text-xs leading-snug text-muted sm:line-clamp-3 sm:text-sm">
            {product.description}
          </p>
        </div>
        <p className="font-display text-base font-extrabold text-espresso sm:text-lg">
          {formatRs(product.basePriceMinor)}
        </p>
      </div>

      <div className="relative aspect-square w-[42%] max-w-[9.5rem] shrink-0 self-center overflow-hidden rounded-2xl bg-surface sm:max-w-[11rem] sm:rounded-[1.15rem]">
        <Image
          src={product.imageUrl}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 640px) 42vw, 176px"
        />
      </div>
    </button>
  );
}
