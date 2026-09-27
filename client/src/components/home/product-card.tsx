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

/** Compact Sugar Latte–style card: text left, image right */
export function ProductCard({ product, className }: Props) {
  const { openProduct } = useUi();

  return (
    <button
      type="button"
      onClick={() => openProduct(product)}
      className={cn(
        "flex w-full items-stretch gap-2 rounded-2xl bg-white p-2.5 text-left shadow-[0_2px_10px_rgba(60,30,24,0.06)] transition hover:shadow-[0_4px_16px_rgba(60,30,24,0.1)] active:scale-[0.99] sm:gap-2.5 sm:p-3",
        className
      )}
      aria-label={`${product.name}, ${formatRs(product.basePriceMinor)}`}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="font-display text-[13px] font-extrabold leading-snug text-espresso line-clamp-2 sm:text-sm">
          {product.name}
        </h3>
        <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted sm:text-[11px]">
          {product.description}
        </p>
        <p className="mt-auto pt-1.5 font-display text-[13px] font-extrabold text-espresso sm:text-sm">
          {formatRs(product.basePriceMinor)}
        </p>
      </div>

      <div className="relative h-[4.75rem] w-[4.75rem] shrink-0 overflow-hidden rounded-xl bg-surface sm:h-[5.25rem] sm:w-[5.25rem]">
        <Image
          src={product.imageUrl}
          alt=""
          fill
          className="object-cover"
          sizes="84px"
        />
      </div>
    </button>
  );
}
