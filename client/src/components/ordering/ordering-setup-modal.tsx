"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { isValidPkPhone, normalizePkPhone } from "@heybrew/shared";
import Image from "next/image";
import { Dialog } from "@/components/ui/dialog";
import { useOrdering } from "@/context/ordering-context";
import { useBranches, useDeliveryZones } from "@/hooks/use-locations";
import type { OrderingSession } from "@/lib/types";
import { cn } from "@/lib/cn";

const schema = z.object({
  type: z.enum(["delivery", "pickup"]),
  locationId: z.string().min(1, "Please select your location"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .refine((v) => isValidPkPhone(v), {
      message: "Use 03XX XXXXXXX format",
    }),
  rememberPhone: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function OrderingSetupModal() {
  const {
    setupOpen,
    setSetupOpen,
    session,
    completeSetup,
    setLocationLabel,
    hydrated,
  } = useOrdering();
  const { data: branches = [] } = useBranches();
  const [type, setType] = useState<"delivery" | "pickup">(session.type);

  const { data: zones = [] } = useDeliveryZones();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      type: session.type,
      locationId: "",
      phone: session.phone || "",
      rememberPhone: session.rememberPhone,
    },
  });

  useEffect(() => {
    if (!hydrated || !setupOpen) return;
    const locationId =
      session.type === "delivery"
        ? session.deliveryZoneId || ""
        : session.branchId || "";
    reset({
      type: session.type,
      locationId,
      phone: session.phone || "",
      rememberPhone: session.rememberPhone,
    });
    setType(session.type);
  }, [setupOpen, hydrated, session, reset]);

  const watchedType = watch("type");

  useEffect(() => {
    setType(watchedType);
  }, [watchedType]);

  const locationOptions = useMemo(() => {
    if (type === "delivery") {
      return zones.map((z) => ({
        id: z.id,
        label: z.name,
        branchId: z.branchId,
      }));
    }
    return branches.map((b) => ({
      id: b.id,
      label: `${b.name} — ${b.addressLabel}`,
      branchId: b.id,
    }));
  }, [type, zones, branches]);

  const canSubmit = isValid && !isSubmitting;

  const onSubmit = (values: FormValues) => {
    const normalized = normalizePkPhone(values.phone)!;
    let branchId: string | null = null;
    let deliveryZoneId: string | null = null;
    let label: string | null = null;

    if (values.type === "delivery") {
      const zone = zones.find((z) => z.id === values.locationId);
      deliveryZoneId = values.locationId;
      branchId = zone?.branchId ?? null;
      label = zone?.name ?? values.locationId;
    } else {
      branchId = values.locationId;
      deliveryZoneId = null;
      const branch = branches.find((b) => b.id === values.locationId);
      label = branch?.name ?? values.locationId;
    }

    const next: OrderingSession = {
      type: values.type,
      branchId,
      deliveryZoneId,
      phone: normalized,
      rememberPhone: values.rememberPhone,
      completed: true,
    };
    setLocationLabel(label);
    completeSetup(next);
  };

  if (!hydrated) return null;

  const locationLabel =
    type === "delivery" ? "Please select your location" : "Select Branch";
  const locationPlaceholder =
    type === "delivery" ? "Please select your location" : "Select Branch";

  return (
    <Dialog
      open={setupOpen}
      onClose={() => {
        if (session.completed) setSetupOpen(false);
      }}
      title="Select Your Order Type"
      variant="modal"
      className="max-w-[22.5rem] bg-white shadow-2xl sm:max-w-md"
      titleSrOnly
    >
      <div className="flex shrink-0 items-center justify-center bg-espresso px-5 py-6 sm:py-7">
        <div className="flex flex-col items-center rounded-2xl bg-white px-4 py-3 shadow-sm">
          <Image
            src="/brand/heybrew-logo-mark.png"
            alt="HeyBrew"
            width={96}
            height={96}
            className="h-20 w-20 object-contain sm:h-24 sm:w-24"
            priority
          />
          <span className="mt-0.5 font-display text-lg font-extrabold tracking-tight text-espresso sm:text-xl">
            HeyBrew.
          </span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-3.5 px-4 pb-6 pt-4 sm:gap-4 sm:px-6 sm:pb-7 sm:pt-5"
      >
        <h2 className="shrink-0 text-center font-display text-xl font-extrabold leading-tight text-espresso sm:text-2xl">
          Select Your Order Type
        </h2>

        <div
          className="flex shrink-0 overflow-hidden rounded-full border border-espresso/15 bg-white p-1"
          role="group"
          aria-label="Order type"
        >
          {(["delivery", "pickup"] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={cn(
                "min-h-11 flex-1 rounded-full px-3 py-2.5 font-display text-sm font-bold transition sm:text-base",
                type === t
                  ? "bg-espresso text-cream"
                  : "bg-transparent text-muted"
              )}
              onClick={() => {
                setValue("type", t, { shouldValidate: true });
                setValue("locationId", "", { shouldValidate: true });
                setType(t);
              }}
              aria-pressed={type === t}
            >
              {t === "delivery" ? "Delivery" : "Pick-Up"}
            </button>
          ))}
        </div>
        <input type="hidden" {...register("type")} />

        <label className="block shrink-0 space-y-1.5">
          <span className="text-sm font-semibold text-espresso">
            {locationLabel}
          </span>
          <div className="relative">
            <select
              className={cn(
                "w-full appearance-none rounded-xl border border-espresso/20 bg-white px-4 py-3 pr-10 text-sm text-espresso",
                "min-h-12 focus:border-espresso/40 focus:outline-none focus:ring-2 focus:ring-espresso/15",
                !watch("locationId") && "text-muted",
                errors.locationId && "border-red-500"
              )}
              aria-invalid={!!errors.locationId}
              {...register("locationId")}
            >
              <option value="">{locationPlaceholder}</option>
              {locationOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            <span
              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted"
              aria-hidden
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 6l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
          {errors.locationId && (
            <span className="text-xs text-red-600" role="alert">
              {errors.locationId.message}
            </span>
          )}
        </label>

        <label className="block shrink-0 space-y-1.5">
          <span className="text-sm font-semibold text-espresso">
            Phone Number
          </span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="03xx-xxxxxxx"
            className={cn(
              "w-full rounded-xl border border-espresso/20 bg-white px-4 py-3 text-sm text-espresso placeholder:text-muted",
              "min-h-12 focus:border-espresso/40 focus:outline-none focus:ring-2 focus:ring-espresso/15",
              errors.phone && "border-red-500"
            )}
            aria-invalid={!!errors.phone}
            {...register("phone")}
          />
          {errors.phone && (
            <span className="text-xs text-red-600" role="alert">
              {errors.phone.message}
            </span>
          )}
        </label>

        <label className="flex shrink-0 cursor-pointer items-center gap-2.5 text-sm text-espresso/80">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-espresso/30 text-espresso focus:ring-espresso"
            {...register("rememberPhone")}
          />
          Remember phone on this device
        </label>

        <button
          type="submit"
          disabled={isSubmitting || !canSubmit}
          className={cn(
            "mt-1 flex min-h-12 w-full shrink-0 items-center justify-center rounded-xl px-4 py-3.5 font-display text-base font-bold text-white transition",
            canSubmit && !isSubmitting
              ? "bg-espresso hover:bg-espresso/90 active:scale-[0.99]"
              : "cursor-not-allowed bg-[#a89086]"
          )}
        >
          Select
        </button>
      </form>
    </Dialog>
  );
}
