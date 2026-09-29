"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  createCoupon,
  deleteCoupon,
  getSettings,
  listBranches,
  listCoupons,
  updateCoupon,
  updateSettings,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { formatKarachi } from "@/lib/dates";
import { formatPkr, parseRupeesToMinor, fromMinor } from "@/lib/money";
import type { Coupon } from "@/types";
import { Badge, EmptyState, PageHeader, SeedBadge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select } from "@/components/ui/field";

const schema = z.object({
  code: z.string().min(2).max(40),
  type: z.enum(["percent", "fixed"]),
  value: z.string().min(1),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  minOrderRupees: z.string().optional(),
  maxDiscountRupees: z.string().optional(),
  usageLimit: z.string().optional(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function toLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  const settingsQuery = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const couponsEnabled = settingsQuery.data?.couponsEnabled === true;

  const listQuery = useQuery({
    queryKey: ["coupons"],
    queryFn: listCoupons,
    enabled: couponsEnabled,
  });
  useQuery({ queryKey: ["branches"], queryFn: listBranches });

  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) => updateSettings({ couponsEnabled: enabled }),
    onSuccess: (settings) => {
      void queryClient.setQueryData(["settings"], settings);
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success(
        settings.couponsEnabled
          ? "Coupon discounts enabled — visible on client checkout"
          : "Coupon discounts disabled — hidden on client"
      );
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Could not update setting"),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
      type: "percent",
      value: "",
      startsAt: "",
      endsAt: "",
      minOrderRupees: "0",
      maxDiscountRupees: "",
      usageLimit: "",
      isActive: true,
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({
      code: "",
      type: "percent",
      value: "",
      startsAt: "",
      endsAt: "",
      minOrderRupees: "0",
      maxDiscountRupees: "",
      usageLimit: "",
      isActive: true,
    });
    setShowForm(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    form.reset({
      code: c.code,
      type: c.type,
      value:
        c.type === "fixed" ? String(fromMinor(c.value)) : String(c.value),
      startsAt: toLocalInput(c.startsAt),
      endsAt: toLocalInput(c.endsAt),
      minOrderRupees: String(fromMinor(c.minOrderMinor ?? 0)),
      maxDiscountRupees:
        c.maxDiscountMinor != null ? String(fromMinor(c.maxDiscountMinor)) : "",
      usageLimit: c.usageLimit != null ? String(c.usageLimit) : "",
      isActive: c.isActive,
    });
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const body = {
        code: values.code.toUpperCase().trim(),
        type: values.type,
        value:
          values.type === "fixed"
            ? parseRupeesToMinor(values.value)
            : Number(values.value),
        startsAt: new Date(values.startsAt).toISOString(),
        endsAt: new Date(values.endsAt).toISOString(),
        minOrderMinor: parseRupeesToMinor(values.minOrderRupees || "0"),
        maxDiscountMinor: values.maxDiscountRupees
          ? parseRupeesToMinor(values.maxDiscountRupees)
          : null,
        usageLimit: values.usageLimit ? Number(values.usageLimit) : null,
        isActive: values.isActive,
      };
      if (editing) return updateCoupon(editing.id, body);
      return createCoupon(body);
    },
    onSuccess: () => {
      toast.success(editing ? "Coupon updated" : "Coupon created");
      setShowForm(false);
      void queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Save failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => {
      toast.success("Coupon deleted");
      void queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Delete failed"),
  });

  return (
    <div>
      <PageHeader
        title="Coupons"
        description="Enable coupon discounts for customers, then create codes with percent or fixed amounts."
      />

      <div className="mb-6 rounded-xl border border-espresso/10 bg-cream-soft p-5 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg text-espresso">
              Enable discounts from coupon codes
            </p>
            <p className="mt-1 text-sm text-espresso/65">
              Off by default. When disabled, the coupon field is hidden on the
              customer cart and checkout.
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-3 self-start sm:self-center">
            <span className="text-sm font-medium text-espresso/70">
              {couponsEnabled ? "On" : "Off"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={couponsEnabled}
              disabled={toggleMutation.isPending || settingsQuery.isLoading}
              onClick={() => toggleMutation.mutate(!couponsEnabled)}
              className={
                couponsEnabled
                  ? "relative h-8 w-14 rounded-full bg-emerald-600 transition"
                  : "relative h-8 w-14 rounded-full bg-espresso/25 transition"
              }
            >
              <span
                className={
                  couponsEnabled
                    ? "absolute left-7 top-1 h-6 w-6 rounded-full bg-white shadow transition"
                    : "absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition"
                }
              />
            </button>
          </label>
        </div>
      </div>

      {!couponsEnabled ? (
        <EmptyState
          title="Coupon discounts are off"
          description='Turn on "Enable discounts from coupon codes" above to create coupons and show the field on the ordering site.'
        />
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add coupon
            </Button>
          </div>

          {showForm ? (
            <form
              className="mb-6 rounded-xl border border-espresso/10 bg-cream-soft p-5 shadow-soft"
              onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
            >
              <h2 className="font-display text-lg">
                {editing ? "Edit coupon" : "New coupon"}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label>Code</Label>
                  <Input {...form.register("code")} className="uppercase" />
                  <FieldError message={form.formState.errors.code?.message} />
                </div>
                <div>
                  <Label>Discount type</Label>
                  <Select {...form.register("type")}>
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed (PKR)</option>
                  </Select>
                </div>
                <div>
                  <Label>
                    Discount{" "}
                    {form.watch("type") === "percent"
                      ? "percentage (%)"
                      : "amount (PKR)"}
                  </Label>
                  <Input
                    {...form.register("value")}
                    placeholder={
                      form.watch("type") === "percent" ? "e.g. 10" : "e.g. 100"
                    }
                  />
                  <FieldError message={form.formState.errors.value?.message} />
                </div>
                <div>
                  <Label>Starts</Label>
                  <Input type="datetime-local" {...form.register("startsAt")} />
                </div>
                <div>
                  <Label>Ends</Label>
                  <Input type="datetime-local" {...form.register("endsAt")} />
                </div>
                <div>
                  <Label>Min order (PKR)</Label>
                  <Input {...form.register("minOrderRupees")} />
                </div>
                <div>
                  <Label>Max discount (PKR, percent caps)</Label>
                  <Input {...form.register("maxDiscountRupees")} />
                </div>
                <div>
                  <Label>Usage limit (blank = unlimited)</Label>
                  <Input {...form.register("usageLimit")} />
                </div>
                <label className="flex items-center gap-2 self-end pb-2 text-sm">
                  <input type="checkbox" {...form.register("isActive")} /> Active
                </label>
              </div>
              <div className="mt-4 flex gap-2">
                <Button type="submit" loading={saveMutation.isPending}>
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}

          {listQuery.isError ? (
            <EmptyState title="Could not load coupons" />
          ) : (listQuery.data ?? []).length === 0 && !listQuery.isLoading ? (
            <EmptyState
              title="No coupons yet"
              description="Create a coupon with a code and discount percentage or fixed amount."
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-espresso/10 bg-cream-soft shadow-soft">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-cream-deep/60 text-xs uppercase text-espresso/55">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Discount</th>
                    <th className="px-4 py-3">Window</th>
                    <th className="px-4 py-3">Usage</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-espresso/8">
                  {(listQuery.data ?? []).map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-3 font-medium">
                        {c.code}
                        {c.developmentSeed ? (
                          <span className="ml-2">
                            <SeedBadge />
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {c.type === "percent"
                          ? `${c.value}%`
                          : formatPkr(c.value)}
                      </td>
                      <td className="px-4 py-3 text-xs text-espresso/65">
                        {formatKarachi(c.startsAt, "dd MMM yyyy")} →{" "}
                        {formatKarachi(c.endsAt, "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3">
                        {c.usedCount}
                        {c.usageLimit != null ? ` / ${c.usageLimit}` : " / ∞"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            c.isActive
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-rose-100 text-rose-800"
                          }
                        >
                          {c.isActive ? "Active" : "Off"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(c)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-700"
                            onClick={() => {
                              if (confirm(`Delete ${c.code}?`)) {
                                deleteMutation.mutate(c.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
