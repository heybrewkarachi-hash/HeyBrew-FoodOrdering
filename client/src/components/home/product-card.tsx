"use client";

import Image from "next/image";
import { formatRs } from "@/lib/format";
import type { Product } from "@/lib/types";
import { IconPlus } from "@/components/ui/icons";
import { useUi } from "@/context/ui-context";
import { cn } from "@/lib/cn";

type Props = {
  product: Product;
  layout?: "grid" | "list";
};

export function ProductCard({ product, layout = "grid" }: Props) {
  const { openProduct } = useUi();

  if (layout === "list") {
    return (
      <article
        className={cn(
          "flex items-stretch gap-4 rounded-card bg-surface p-4 shadow-soft/50 transition hover:shadow-soft"
        )}
      >
        <button
          type="button"
          className="flex min-w-0 flex-1 flex-col items-start text-left"
          onClick={() => openProduct(product)}
        >
          <h3 className="font-display text-lg font-extrabold text-espresso">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted">
            {product.description}
          </p>
          <p className="mt-3 font-display text-base font-bold text-espresso">
            {formatRs(product.basePriceMinor)}
          </p>
        </button>
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl">
          <Image
            src={product.imageUrl}
            alt="Temporary placeholder image"
            fill
            className="object-cover"
            sizes="112px"
          />
          <button
            type="button"
            className="absolute bottom-2 right-2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-espresso text-cream shadow-soft"
            aria-label={`Add ${product.name}`}
            onClick={() => openProduct(product)}
          >
            <IconPlus />
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-card bg-surface shadow-soft/50 transition hover:shadow-soft">
      <button
        type="button"
        className="relative aspect-[5/3.4] w-full overflow-hidden md:aspect-[16/11]"
        onClick={() => openProduct(product)}
      >
        <Image
          src={product.imageUrl}
          alt="Temporary placeholder image"
          fill
          className="object-cover transition duration-500 hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </button>
      <div className="relative flex flex-1 flex-col gap-1 px-4 pb-4 pt-3 md:gap-1.5 md:px-4 md:pb-4 md:pt-3">
        <h3 className="font-display text-base font-extrabold text-espresso md:text-lg">
          {product.name}
        </h3>
        <p className="line-clamp-1 text-xs text-muted md:line-clamp-2 md:text-sm">
          {product.description}
        </p>
        <div className="mt-1 flex items-center justify-between md:mt-2">
          <p className="font-display text-base font-bold text-espresso">
            {formatRs(product.basePriceMinor)}
          </p>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-espresso text-cream"
            aria-label={`Add ${product.name}`}
            onClick={() => openProduct(product)}
          >
            <IconPlus />
          </button>
        </div>
      </div>
    </article>
  );
}
