"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { isValidPkPhone, normalizePkPhone } from "@heybrew/shared";
import type { PaymentMethod } from "@heybrew/shared";
import { placeOrder, ApiError } from "@/lib/api";
import { formatRs } from "@/lib/format";
import { useCart } from "@/context/cart-context";
import { useOrdering } from "@/context/ordering-context";
import { useBranches } from "@/hooks/use-locations";
import { Button } from "@/components/ui/button";
import { TextAreaField, TextField, SelectField } from "@/components/ui/fields";
import { IconArrowRight } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

const schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  phone: z
    .string()
    .trim()
    .refine((v) => isValidPkPhone(v), {
      message: "Use 03XX XXXXXXX format",
    }),
  line1: z.string().optional(),
  landmark: z.string().optional(),
  area: z.string().optional(),
  branchId: z.string().optional(),
  notes: z.string().max(500).optional(),
  paymentMethod: z.enum([
    "cod",
    "pay_at_pickup",
    "card_placeholder",
    "wallet_placeholder",
  ]),
});

type FormValues = z.infer<typeof schema>;

/** Extensible payment interface stub — only COD / pay-at-pickup enabled. */
function paymentOptions(isDelivery: boolean): Array<{
  id: PaymentMethod;
  label: string;
  enabled: boolean;
  hint?: string;
}> {
  return [
    {
      id: isDelivery ? "cod" : "pay_at_pickup",
      label: isDelivery ? "Cash on delivery" : "Pay at pickup",
      enabled: true,
    },
    {
      id: "card_placeholder",
      label: "Card (coming soon)",
      enabled: false,
      hint: "Configure payment provider in admin — not available yet",
    },
    {
      id: "wallet_placeholder",
      label: "Wallet (coming soon)",
      enabled: false,
      hint: "Configure payment provider in admin — not available yet",
    },
  ];
}

export function CheckoutForm() {
  const router = useRouter();
  const { session, openSetup } = useOrdering();
  const { items, couponCode, validated, clearCart, itemCount } = useCart();
  const { data: branches = [] } = useBranches();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isDelivery = session.type === "delivery";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: session.phone || "",
      line1: "",
      landmark: "",
      area: "",
      branchId: session.branchId || "",
      notes: "",
      paymentMethod: isDelivery ? "cod" : "pay_at_pickup",
    },
  });

  const paymentMethod = watch("paymentMethod");
  const options = paymentOptions(isDelivery);

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);

    if (!session.completed || !session.branchId) {
      openSetup();
      setSubmitError("Please complete ordering setup first.");
      return;
    }
    if (!items.length) {
      setSubmitError("Your cart is empty.");
      return;
    }
    if (isDelivery) {
      if (!values.line1 || values.line1.trim().length < 3) {
        setSubmitError("Delivery address is required.");
        return;
      }
      if (!values.area || values.area.trim().length < 2) {
        setSubmitError("Area is required for delivery.");
        return;
      }
      if (!session.deliveryZoneId) {
        openSetup();
        setSubmitError("Please select a delivery zone.");
        return;
      }
    }
    const allowed: PaymentMethod[] = isDelivery
      ? ["cod"]
      : ["pay_at_pickup"];
    if (!allowed.includes(values.paymentMethod)) {
      setSubmitError(
        "Only cash on delivery / pay at pickup is available. Online payments: Configure in admin."
      );
      return;
    }

    try {
      const result = await placeOrder({
        type: session.type,
        branchId: isDelivery
          ? session.branchId
          : values.branchId || session.branchId,
        deliveryZoneId: isDelivery ? session.deliveryZoneId : null,
        items: items.map((i) => ({
          productId: i.productId,
          variantId:
            i.variantId && i.variantId !== "default" ? i.variantId : null,
          quantity: i.quantity,
          modifiers: i.modifiers.map((m) => ({
            groupId: m.groupId,
            optionId: m.optionId,
            name: m.name,
            priceDeltaMinor: m.priceDeltaMinor,
          })),
          notes: i.notes,
        })),
        couponCode,
        paymentMethod: values.paymentMethod,
        customer: {
          name: values.name.trim(),
          phone: normalizePkPhone(values.phone)!,
        },
        address: isDelivery
          ? {
              line1: values.line1!.trim(),
              area: values.area!.trim(),
              city: "Karachi",
              landmark: values.landmark?.trim() || null,
            }
          : null,
        notes: values.notes?.trim() || null,
      });

      clearCart();
      router.push(
        `/track/${result.orderId}?token=${encodeURIComponent(result.accessToken)}`
      );
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : "Could not place order. Please try again.";
      setSubmitError(msg);
    }
  };

  if (!itemCount) {
    return (
      <div className="rounded-card bg-surface p-8 text-center">
        <p className="font-display text-xl font-bold">Your cart is empty</p>
        <Button className="mt-4" onClick={() => router.push("/#menu")}>
          Browse menu
        </Button>
      </div>
    );
  }

  const total = validated?.grandTotalMinor ?? 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-card bg-surface p-4 text-sm">
        <p className="font-display font-bold">
          {isDelivery ? "Delivery" : "Pick-Up"}
        </p>
        <button
          type="button"
          className="mt-1 text-muted underline"
          onClick={openSetup}
        >
          Change location / order type
        </button>
      </div>

      <TextField
        label="Full name"
        autoComplete="name"
        error={errors.name?.message}
        {...register("name")}
      />
      <TextField
        label="Phone"
        placeholder="03XX XXXXXXX"
        inputMode="tel"
        autoComplete="tel"
        error={errors.phone?.message}
        {...register("phone")}
      />

      {isDelivery ? (
        <>
          <TextField
            label="Address"
            placeholder="House / street"
            autoComplete="street-address"
            {...register("line1")}
          />
          <TextField
            label="Area"
            placeholder="e.g. Clifton"
            {...register("area")}
          />
          <TextField
            label="Landmark (optional)"
            placeholder="Near…"
            {...register("landmark")}
          />
        </>
      ) : (
        <SelectField label="Pickup branch" {...register("branchId")}>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </SelectField>
      )}

      <TextAreaField
        label="Order notes (optional)"
        maxLength={500}
        placeholder="Gate code, allergies, etc."
        {...register("notes")}
      />

      <fieldset>
        <legend className="mb-3 font-display text-sm font-bold">
          Payment method
        </legend>
        <div className="space-y-2">
          {options.map((opt) => (
            <label
              key={opt.id}
              className={cn(
                "flex min-h-touch cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3",
                paymentMethod === opt.id
                  ? "border-espresso bg-cream"
                  : "border-espresso/10 bg-surface",
                !opt.enabled && "cursor-not-allowed opacity-50"
              )}
            >
              <input
                type="radio"
                className="mt-1"
                value={opt.id}
                disabled={!opt.enabled}
                checked={paymentMethod === opt.id}
                onChange={() =>
                  opt.enabled && setValue("paymentMethod", opt.id)
                }
              />
              <span>
                <span className="block font-semibold">{opt.label}</span>
                {opt.hint && (
                  <span className="text-xs text-muted">{opt.hint}</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="rounded-card bg-espresso p-4 text-cream">
        <div className="flex items-center justify-between">
          <span className="text-sm text-cream/80">Grand total</span>
          <span className="font-display text-2xl font-extrabold">
            {formatRs(total)}
          </span>
        </div>
        {validated?.source === "demo" && (
          <p className="mt-2 text-[10px] text-cream/60">
            DEVELOPMENT FALLBACK — order may be local-only if API is down.
          </p>
        )}
      </div>

      {submitError && (
        <p className="text-sm text-red-600" role="alert">
          {submitError}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full justify-between"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Placing order…" : "Place order"}
        <IconArrowRight />
      </Button>
    </form>
  );
}
