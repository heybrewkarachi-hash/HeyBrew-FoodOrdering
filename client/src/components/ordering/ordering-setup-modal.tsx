"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { isValidPkPhone, normalizePkPhone } from "@heybrew/shared";
import Image from "next/image";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField, SelectField } from "@/components/ui/fields";
import { CheckerboardAccent } from "@/components/decorations/brand-art";
import { IconArrowRight } from "@/components/ui/icons";
import { useOrdering } from "@/context/ordering-context";
import { useBranches, useDeliveryZones } from "@/hooks/use-locations";
import type { OrderingSession } from "@/lib/types";
import { cn } from "@/lib/cn";

const schema = z
  .object({
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
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
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

  const onSubmit = (values: FormValues) => {
    const phone = normalizePkPhone(values.phone)!;
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
      phone,
      rememberPhone: values.rememberPhone,
      completed: true,
    };
    setLocationLabel(label);
    completeSetup(next);
  };

  if (!hydrated) return null;

  return (
    <Dialog
      open={setupOpen}
      onClose={() => {
        if (session.completed) setSetupOpen(false);
      }}
      title="Select Your Order Type"
      variant="auto"
      className="max-w-md overflow-hidden p-0"
      titleSrOnly
    >
      <div className="relative bg-espresso px-5 py-6 text-center">
        <CheckerboardAccent
          tone="cream"
          className="absolute left-3 top-1/2 h-8 w-8 -translate-y-1/2 opacity-80"
        />
        <CheckerboardAccent
          tone="cream"
          className="absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2 opacity-80"
        />
        <div className="mx-auto inline-flex rounded-2xl bg-cream p-2 shadow-soft">
          <Image
            src="/brand/heybrew-logo.jpg"
            alt="HeyBrew"
            width={64}
            height={64}
            className="h-14 w-14 object-contain"
          />
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 px-5 py-6 safe-pb"
      >
        <h2 className="text-center font-display text-2xl font-extrabold text-espresso">
          Select Your Order Type
        </h2>

        <div
          className="flex rounded-pill bg-surface p-1"
          role="group"
          aria-label="Order type"
        >
          {(["delivery", "pickup"] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={cn(
                "min-h-touch flex-1 rounded-pill px-4 py-2.5 font-display text-sm font-bold transition",
                type === t
                  ? "bg-espresso text-cream"
                  : "text-espresso hover:bg-cream/60"
              )}
              onClick={() => {
                setValue("type", t);
                setValue("locationId", "");
                setType(t);
              }}
              aria-pressed={type === t}
            >
              {t === "delivery" ? "Delivery" : "Pick-Up"}
            </button>
          ))}
        </div>
        <input type="hidden" {...register("type")} />

        <SelectField
          label={
            type === "delivery"
              ? "Please select your location"
              : "Please select your branch"
          }
          error={errors.locationId?.message}
          hint="Zones and branches are development seed until configured in admin."
          {...register("locationId")}
        >
          <option value="">
            {type === "delivery" ? "Select your area" : "Select branch"}
          </option>
          {locationOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </SelectField>

        <TextField
          label="Phone Number"
          placeholder="03XX XXXXXXX"
          inputMode="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />

        <label className="flex min-h-touch cursor-pointer items-center gap-3 text-sm text-espresso">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-espresso/30 text-espresso focus:ring-espresso"
            {...register("rememberPhone")}
          />
          Remember phone on this device
        </label>

        <Button
          type="submit"
          size="lg"
          className="w-full justify-between"
          disabled={isSubmitting}
        >
          Continue
          <IconArrowRight className="h-5 w-5" />
        </Button>

        {!session.completed && (
          <p className="text-center text-xs text-muted">
            Choose how you&apos;d like to order to browse the menu.
          </p>
        )}
      </form>
    </Dialog>
  );
}
