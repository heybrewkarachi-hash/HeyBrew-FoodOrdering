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
 * one full-width row on mobile (text left / image right); 2-col grid from md up.
 */
export function ProductCard({ product, className }: Props) {
  const { openProduct } = useUi();

  return (
    <button
      type="button"
      onClick={() => openProduct(product)}
      className={cn(
        "flex w-full min-h-[9.5rem] items-stretch gap-3 rounded-2xl bg-white p-3.5 text-left",
        "shadow-[0_2px_14px_rgba(60,30,24,0.08)] transition",
        "hover:shadow-[0_6px_20px_rgba(60,30,24,0.12)] active:scale-[0.995]",
        "sm:min-h-[10.5rem] sm:gap-4 sm:rounded-[1.25rem] sm:p-4",
        className
      )}
      aria-label={`${product.name}, ${formatRs(product.basePriceMinor)}`}
    >
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <h3 className="shrink-0 font-display text-[1.05rem] font-extrabold leading-tight text-espresso line-clamp-2 sm:text-lg">
          {product.name}
        </h3>
        <p className="my-auto line-clamp-2 py-1.5 text-xs leading-snug text-muted sm:line-clamp-3 sm:py-2 sm:text-sm">
          {product.description}
        </p>
        <p className="shrink-0 font-display text-base font-extrabold text-espresso sm:text-lg">
          {product.variants.length > 1
            ? `from ${formatRs(product.basePriceMinor)}`
            : formatRs(product.basePriceMinor)}
        </p>
      </div>

      <div className="relative aspect-square w-[38%] max-w-[8.5rem] shrink-0 self-center overflow-hidden rounded-2xl bg-surface sm:max-w-[10.5rem] sm:w-[40%] sm:rounded-[1.15rem] md:max-w-[11rem]">
        <Image
          src={product.imageUrl}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 38vw, 176px"
        />
      </div>
    </button>
  );
}
