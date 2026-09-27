"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/fields";
import {
  BaristaLineArt,
  CheckerboardAccent,
} from "@/components/decorations/brand-art";
import {
  IconArrowRight,
  IconCart,
  IconFlame,
  IconList,
  IconMinus,
  IconPlus,
  IconTag,
  IconTrash,
  IconTruck,
  IconX,
} from "@/components/ui/icons";
import { useCart } from "@/context/cart-context";
import { useMenu } from "@/hooks/use-menu";
import { useUi } from "@/context/ui-context";
import { formatRs, formatSaved } from "@/lib/format";
import { cn } from "@/lib/cn";

export function CartDrawer() {
  const {
    drawerOpen,
    setDrawerOpen,
    items,
    updateQty,
    removeItem,
    validated,
    couponCode,
    setCouponCode,
    isValidating,
    revalidate,
  } = useCart();
  const { data: menu } = useMenu();
  const { openProduct } = useUi();
  const [couponInput, setCouponInput] = useState(couponCode || "");

  const upsells =
    menu?.products.filter(
      (p) =>
        p.categoryId === "cat-treats" ||
        p.tags?.includes("treat") ||
        p.name.toLowerCase().includes("brownie") ||
        p.name.toLowerCase().includes("cookie")
    ).slice(0, 4) ?? [];

  const subtotal =
    validated?.subtotalMinor ??
    items.reduce((s, i) => s + i.unitPriceMinor * i.quantity, 0);
  const delivery = validated?.deliveryFeeMinor ?? 0;
  const discount = validated?.discountMinor ?? 0;
  const grand =
    validated?.grandTotalMinor ?? Math.max(0, subtotal + delivery - discount);

  return (
    <Dialog
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      title="Your Cart"
      variant="auto"
      className="max-w-md overflow-hidden p-0 md:max-h-[90vh]"
      titleSrOnly
    >
      <div className="relative flex items-center justify-between bg-espresso px-4 py-4 text-cream">
        <div className="flex items-center gap-2">
          <Image
            src="/brand/heybrew-logo.jpg"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg bg-cream object-contain p-0.5"
          />
          <div>
            <p className="font-display text-sm font-bold leading-none">HeyBrew</p>
            <p className="mt-1 inline-flex items-center gap-1 font-display text-lg font-extrabold">
              <IconCart className="h-4 w-4" /> Your Cart
            </p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-cream/30"
          aria-label="Close cart"
          onClick={() => setDrawerOpen(false)}
        >
          <IconX />
        </button>
        <CheckerboardAccent
          tone="cream"
          className="pointer-events-none absolute right-16 top-3 h-8 w-8 opacity-40"
        />
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {items.length === 0 ? (
          <div className="space-y-4 py-10 text-center">
            <BaristaLineArt className="mx-auto" />
            <p className="font-display text-lg font-bold text-espresso">
              Your cart is empty
            </p>
            <Button
              onClick={() => {
                setDrawerOpen(false);
                document.getElementById("menu")?.scrollIntoView();
              }}
            >
              Browse menu
            </Button>
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.key}
                  className="flex gap-3 rounded-card bg-surface p-3"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
                    <Image
                      src={item.imageUrl}
                      alt="Temporary placeholder image"
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold text-espresso">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted">
                      {item.quantity} item{item.quantity === 1 ? "" : "s"}
                      {item.modifiers.length
                        ? ` · ${item.modifiers.map((m) => m.name).join(", ")}`
                        : ""}
                    </p>
                    <p className="mt-1 font-display font-bold text-espresso">
                      {formatRs(item.unitPriceMinor * item.quantity)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <div className="flex items-center gap-1 rounded-pill bg-cream p-0.5">
                      <button
                        type="button"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-red-700"
                        aria-label="Remove one"
                        onClick={() => {
                          if (item.quantity <= 1) removeItem(item.key);
                          else updateQty(item.key, item.quantity - 1);
                        }}
                      >
                        {item.quantity <= 1 ? (
                          <IconTrash className="h-4 w-4" />
                        ) : (
                          <IconMinus className="h-4 w-4" />
                        )}
                      </button>
                      <span className="min-w-5 text-center text-sm font-bold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-espresso text-cream"
                        aria-label="Add one"
                        onClick={() => updateQty(item.key, item.quantity + 1)}
                      >
                        <IconPlus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="flex min-h-touch w-full items-center justify-center gap-2 rounded-card border border-dashed border-espresso/30 py-3 font-display text-sm font-bold text-espresso"
              onClick={() => {
                setDrawerOpen(false);
                document.getElementById("menu")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              <IconPlus className="h-4 w-4" /> Add more items
            </button>

            {upsells.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <IconFlame className="text-espresso" />
                  <p className="font-display font-bold text-espresso">
                    Popular with your order
                  </p>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                  {upsells.map((p) => (
                    <div
                      key={p.id}
                      className="w-36 shrink-0 overflow-hidden rounded-card bg-cream shadow-soft"
                    >
                      <div className="relative aspect-square">
                        <Image
                          src={p.imageUrl}
                          alt="Temporary placeholder image"
                          fill
                          className="object-cover"
                          sizes="144px"
                        />
                        <button
                          type="button"
                          className="absolute bottom-2 right-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-espresso text-cream"
                          aria-label={`Add ${p.name}`}
                          onClick={() => {
                            openProduct(p);
                            setDrawerOpen(false);
                          }}
                        >
                          <IconPlus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="p-2">
                        <p className="truncate text-sm font-bold">{p.name}</p>
                        <p className="text-xs font-semibold">
                          {formatRs(p.basePriceMinor)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <TextField
                label="Coupon code"
                placeholder="e.g. DEMO10"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                hint="Development seed coupon DEMO10 works in fallback mode."
              />
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setCouponCode(couponInput || null);
                  revalidate();
                }}
              >
                Apply coupon
              </Button>
              {validated?.couponMessage && (
                <p className="text-xs text-muted">{validated.couponMessage}</p>
              )}
            </div>

            <div className="space-y-3 rounded-card bg-surface p-4">
              <SummaryRow
                icon={<IconList />}
                label="Subtotal"
                value={formatRs(subtotal)}
              />
              <SummaryRow
                icon={<IconTruck />}
                label="Delivery Fee"
                value={formatRs(delivery)}
              />
              <SummaryRow
                icon={<IconTag />}
                label="Discount"
                value={
                  discount > 0 ? `− ${formatRs(discount)}` : formatRs(0)
                }
                valueClass={discount > 0 ? "text-success" : undefined}
              />
              <div className="border-t border-espresso/10 pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-extrabold">
                    Grand Total
                  </span>
                  <span className="font-display text-lg font-extrabold">
                    {formatRs(grand)}
                  </span>
                </div>
              </div>
            </div>

            {discount > 0 && (
              <p className="rounded-pill bg-success-soft px-4 py-2 text-center text-sm font-semibold text-success">
                {formatSaved(discount)}
              </p>
            )}

            {validated?.source === "demo" && (
              <p className="text-center text-[10px] text-muted">
                DEVELOPMENT FALLBACK totals · Demo details
              </p>
            )}
            {isValidating && (
              <p className="text-center text-xs text-muted">Updating totals…</p>
            )}
          </>
        )}
      </div>

      {items.length > 0 && (
        <div className="border-t border-espresso/10 bg-espresso p-4 safe-pb">
          <div className="flex items-center gap-3 rounded-pill bg-espresso">
            <div className="px-4 text-cream">
              <p className="text-[10px] uppercase tracking-wide text-cream/70">
                Grand Total
              </p>
              <p className="font-display text-xl font-extrabold">
                {formatRs(grand)}
              </p>
            </div>
            <div className="h-10 w-px bg-cream/30" />
            <Link
              href="/checkout"
              onClick={() => setDrawerOpen(false)}
              className={cn(
                "flex min-h-touch flex-1 items-center justify-center gap-2 rounded-pill bg-cream px-4 py-3 font-display font-extrabold text-espresso"
              )}
            >
              Checkout
              <IconArrowRight />
            </Link>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="inline-flex items-center gap-2 text-espresso">
        <span className="text-muted">{icon}</span>
        {label}
      </span>
      <span className={cn("font-semibold", valueClass)}>{value}</span>
    </div>
  );
}
