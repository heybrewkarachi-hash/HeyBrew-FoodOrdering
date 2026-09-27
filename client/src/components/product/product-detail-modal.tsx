"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  IconArrowRight,
  IconMinus,
  IconPlus,
  IconShare,
  IconX,
} from "@/components/ui/icons";
import { buildLineFromProduct, useCart } from "@/context/cart-context";
import { useUi } from "@/context/ui-context";
import { unitPriceForSelection } from "@/lib/demo-catalog";
import { formatRs } from "@/lib/format";
import { cn } from "@/lib/cn";

const NOTES_MAX = 500;

export function ProductDetailModal() {
  const { selectedProduct, closeProduct } = useUi();
  const { addItem } = useCart();
  const product = selectedProduct;

  const [variantId, setVariantId] = useState<string | null>(null);
  const [selectedMods, setSelectedMods] = useState<
    Record<string, string[]>
  >({});
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!product) return;
    const def =
      product.variants.find((v) => v.isDefault)?.id ??
      product.variants[0]?.id ??
      null;
    setVariantId(def);
    const mods: Record<string, string[]> = {};
    for (const g of product.modifierGroups) {
      const defaults = g.options.filter((o) => o.isDefault).map((o) => o.id);
      mods[g.id] =
        defaults.length > 0
          ? defaults.slice(0, g.maxSelect || 1)
          : g.minSelect > 0 && g.options[0]
            ? [g.options[0].id]
            : [];
    }
    setSelectedMods(mods);
    setQty(1);
    setNotes("");
  }, [product]);

  const modifiers = useMemo(() => {
    if (!product) return [];
    return product.modifierGroups.flatMap((g) => {
      const ids = selectedMods[g.id] || [];
      return ids
        .map((oid) => {
          const opt = g.options.find((o) => o.id === oid);
          if (!opt) return null;
          return {
            groupId: g.id,
            optionId: opt.id,
            name: opt.name,
            priceDeltaMinor: opt.priceDeltaMinor,
          };
        })
        .filter(Boolean) as Array<{
        groupId: string;
        optionId: string;
        name: string;
        priceDeltaMinor: number;
      }>;
    });
  }, [product, selectedMods]);

  const unitPrice = product
    ? unitPriceForSelection(product, variantId, modifiers)
    : 0;
  const lineTotal = unitPrice * qty;

  const toggleMod = (groupId: string, optionId: string, maxSelect: number) => {
    setSelectedMods((prev) => {
      const current = prev[groupId] || [];
      if (maxSelect <= 1) {
        return { ...prev, [groupId]: [optionId] };
      }
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      }
      if (current.length >= maxSelect) return prev;
      return { ...prev, [groupId]: [...current, optionId] };
    });
  };

  const missingRequired = product?.modifierGroups.some((g) => {
    const count = (selectedMods[g.id] || []).length;
    return count < g.minSelect;
  });

  const onAdd = () => {
    if (!product || missingRequired) return;
    addItem(
      buildLineFromProduct(product, {
        variantId,
        modifiers,
        notes: notes.slice(0, NOTES_MAX),
        quantity: qty,
      })
    );
    closeProduct();
  };

  const share = async () => {
    if (!product) return;
    const url = `${window.location.origin}/?product=${product.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Link copied");
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <Dialog
      open={!!product}
      onClose={closeProduct}
      title={product?.name || "Product"}
      variant="auto"
      className="max-w-lg overflow-hidden p-0"
      titleSrOnly
    >
      {product && (
        <>
          <div className="relative aspect-[5/4] w-full shrink-0">
            <Image
              src={product.imageUrl}
              alt="Temporary placeholder image"
              fill
              className="object-cover"
              sizes="512px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-transparent to-transparent" />
            <div className="absolute right-3 top-3 flex gap-2">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-espresso text-cream"
                aria-label="Share"
                onClick={share}
              >
                <IconShare />
              </button>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-espresso text-cream"
                aria-label="Close"
                onClick={closeProduct}
              >
                <IconX />
              </button>
            </div>
            <div className="absolute inset-x-0 bottom-0 space-y-1 p-5">
              <h2 className="font-display text-2xl font-extrabold text-cream">
                {product.name}
              </h2>
              <p className="text-sm text-cream/90">{product.description}</p>
            </div>
          </div>

          <div className="space-y-5 px-5 py-5 safe-pb">
            <div className="flex items-baseline justify-between">
              <p className="font-display text-2xl font-extrabold text-espresso">
                {formatRs(unitPrice)}
              </p>
              <span className="text-[10px] uppercase tracking-wide text-muted">
                Demo details
              </span>
            </div>

            {product.variants.length > 0 && (
              <fieldset>
                <legend className="mb-2 font-display text-sm font-bold text-espresso">
                  Size
                </legend>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className={cn(
                        "min-h-touch rounded-pill px-4 py-2 text-sm font-semibold",
                        variantId === v.id
                          ? "bg-espresso text-cream"
                          : "bg-surface text-espresso"
                      )}
                      onClick={() => setVariantId(v.id)}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {product.modifierGroups.map((g) => (
              <fieldset key={g.id}>
                <legend className="mb-2 font-display text-sm font-bold text-espresso">
                  {g.name}
                  {g.minSelect > 0 ? " *" : ""}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {g.options.map((o) => {
                    const active = (selectedMods[g.id] || []).includes(o.id);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        className={cn(
                          "min-h-touch rounded-pill px-4 py-2 text-sm font-semibold",
                          active
                            ? "bg-espresso text-cream"
                            : "bg-surface text-espresso"
                        )}
                        onClick={() => toggleMod(g.id, o.id, g.maxSelect)}
                      >
                        {o.name}
                        {o.priceDeltaMinor > 0
                          ? ` (+${formatRs(o.priceDeltaMinor)})`
                          : ""}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}

            <div>
              <label
                htmlFor="special-notes"
                className="mb-2 block font-display text-sm font-bold text-espresso"
              >
                Special Instructions
              </label>
              <textarea
                id="special-notes"
                value={notes}
                maxLength={NOTES_MAX}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests?"
                className="min-h-[96px] w-full rounded-2xl border border-espresso/15 bg-cream px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-espresso/20"
              />
              <p className="mt-1 text-right text-xs text-muted">
                {notes.length}/{NOTES_MAX}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 rounded-pill bg-surface p-1">
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-cream text-espresso"
                  aria-label="Decrease quantity"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  <IconMinus />
                </button>
                <span className="min-w-8 text-center font-display font-bold">
                  {qty}
                </span>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-espresso text-cream"
                  aria-label="Increase quantity"
                  onClick={() => setQty((q) => Math.min(99, q + 1))}
                >
                  <IconPlus />
                </button>
              </div>
              <Button
                className="flex-1 justify-between"
                size="lg"
                disabled={!!missingRequired}
                onClick={onAdd}
              >
                <span>
                  {formatRs(lineTotal)} | Add to Cart
                </span>
                <IconArrowRight />
              </Button>
            </div>
          </div>
        </>
      )}
    </Dialog>
  );
}
