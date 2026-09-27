"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  createBranch,
  createDeliveryZone,
  deleteBranch,
  deleteDeliveryZone,
  listBranches,
  listDeliveryZones,
  updateBranch,
  updateDeliveryZone,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { formatPkr, fromMinor, parseRupeesToMinor } from "@/lib/money";
import { slugify } from "@/lib/utils";
import type { Branch, DeliveryZone } from "@/types";
import { Badge, EmptyState, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/field";

const branchSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  line1: z.string().min(3),
  line2: z.string().optional(),
  area: z.string().min(2),
  city: z.string().min(2),
  phone: z.string().optional(),
  isPickupOpen: z.boolean(),
  orderingPaused: z.boolean(),
  isActive: z.boolean(),
});

const zoneSchema = z.object({
  name: z.string().min(2),
  branchId: z.string().min(1),
  feeRupees: z.string().min(1),
  minOrderRupees: z.string().optional(),
  polygonNote: z.string().optional(),
  isActive: z.boolean(),
});

type BranchForm = z.infer<typeof branchSchema>;
type ZoneForm = z.infer<typeof zoneSchema>;

export default function BranchesPage() {
  const queryClient = useQueryClient();
  const [branchFormOpen, setBranchFormOpen] = useState(false);
  const [zoneFormOpen, setZoneFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);

  const branchesQuery = useQuery({ queryKey: ["branches"], queryFn: listBranches });
  const zonesQuery = useQuery({ queryKey: ["delivery-zones"], queryFn: () => listDeliveryZones() });

  const branchForm = useForm<BranchForm>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: "",
      slug: "",
      line1: "",
      line2: "",
      area: "",
      city: "Karachi",
      phone: "",
      isPickupOpen: true,
      orderingPaused: false,
      isActive: true,
    },
  });

  const zoneForm = useForm<ZoneForm>({
    resolver: zodResolver(zoneSchema),
    defaultValues: {
      name: "",
      branchId: "",
      feeRupees: "",
      minOrderRupees: "0",
      polygonNote: "",
      isActive: true,
    },
  });

  const openBranchCreate = () => {
    setEditingBranch(null);
    branchForm.reset({
      name: "",
      slug: "",
      line1: "",
      line2: "",
      area: "",
      city: "Karachi",
      phone: "",
      isPickupOpen: true,
      orderingPaused: false,
      isActive: true,
    });
    setBranchFormOpen(true);
  };

  const openBranchEdit = (b: Branch) => {
    setEditingBranch(b);
    branchForm.reset({
      name: b.name,
      slug: b.slug,
      line1: b.address.line1,
      line2: b.address.line2 ?? "",
      area: b.address.area,
      city: b.address.city,
      phone: b.phone ?? "",
      isPickupOpen: b.isPickupOpen,
      orderingPaused: b.orderingPaused,
      isActive: b.isActive,
    });
    setBranchFormOpen(true);
  };

  const saveBranch = useMutation({
    mutationFn: async (values: BranchForm) => {
      const body = {
        name: values.name,
        slug: values.slug,
        address: {
          line1: values.line1,
          line2: values.line2 || null,
          area: values.area,
          city: values.city,
        },
        phone: values.phone || null,
        isPickupOpen: values.isPickupOpen,
        orderingPaused: values.orderingPaused,
        isActive: values.isActive,
      };
      if (editingBranch) return updateBranch(editingBranch.id, body);
      return createBranch(body);
    },
    onSuccess: () => {
      toast.success(editingBranch ? "Branch updated" : "Branch created");
      setBranchFormOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Save failed"),
  });

  const saveZone = useMutation({
    mutationFn: async (values: ZoneForm) => {
      const body = {
        name: values.name,
        branchId: values.branchId,
        feeMinor: parseRupeesToMinor(values.feeRupees),
        minOrderMinor: parseRupeesToMinor(values.minOrderRupees || "0"),
        polygonNote: values.polygonNote || null,
        isActive: values.isActive,
      };
      if (editingZone) return updateDeliveryZone(editingZone.id, body);
      return createDeliveryZone(body);
    },
    onSuccess: () => {
      toast.success(editingZone ? "Zone updated" : "Zone created");
      setZoneFormOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Save failed"),
  });

  const branchName = (id: string) =>
    branchesQuery.data?.find((b) => b.id === id)?.name ?? id.slice(-6);

  return (
    <div>
      <PageHeader
        title="Branches & zones"
        description="Pickup locations and delivery zones (fees in PKR). Polygon notes are descriptive until geo is added."
        actions={
          <>
            <Button size="sm" variant="outline" onClick={openBranchCreate}>
              <Plus className="h-4 w-4" />
              Branch
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingZone(null);
                zoneForm.reset({
                  name: "",
                  branchId: branchesQuery.data?.[0]?.id ?? "",
                  feeRupees: "",
                  minOrderRupees: "0",
                  polygonNote: "",
                  isActive: true,
                });
                setZoneFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Zone
            </Button>
          </>
        }
      />

      {branchFormOpen ? (
        <form
          className="mb-6 rounded-xl border border-espresso/10 bg-cream-soft p-5 shadow-soft"
          onSubmit={branchForm.handleSubmit((v) => saveBranch.mutate(v))}
        >
          <h2 className="font-display text-lg">
            {editingBranch ? "Edit branch" : "New branch"}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Name</Label>
              <Input
                {...branchForm.register("name")}
                onBlur={(e) => {
                  if (!editingBranch && !branchForm.getValues("slug")) {
                    branchForm.setValue("slug", slugify(e.target.value));
                  }
                }}
              />
              <FieldError message={branchForm.formState.errors.name?.message} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input {...branchForm.register("slug")} />
            </div>
            <div>
              <Label>Address line 1</Label>
              <Input {...branchForm.register("line1")} />
            </div>
            <div>
              <Label>Line 2</Label>
              <Input {...branchForm.register("line2")} />
            </div>
            <div>
              <Label>Area</Label>
              <Input {...branchForm.register("area")} />
            </div>
            <div>
              <Label>City</Label>
              <Input {...branchForm.register("city")} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input {...branchForm.register("phone")} />
            </div>
            <div className="flex flex-wrap gap-4 self-end pb-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" {...branchForm.register("isPickupOpen")} /> Pickup open
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...branchForm.register("orderingPaused")} /> Ordering paused
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...branchForm.register("isActive")} /> Active
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" loading={saveBranch.isPending}>
              Save branch
            </Button>
            <Button type="button" variant="ghost" onClick={() => setBranchFormOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {zoneFormOpen ? (
        <form
          className="mb-6 rounded-xl border border-espresso/10 bg-cream-soft p-5 shadow-soft"
          onSubmit={zoneForm.handleSubmit((v) => saveZone.mutate(v))}
        >
          <h2 className="font-display text-lg">
            {editingZone ? "Edit zone" : "New delivery zone"}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Name</Label>
              <Input {...zoneForm.register("name")} />
            </div>
            <div>
              <Label>Branch</Label>
              <Select {...zoneForm.register("branchId")}>
                <option value="">Select…</option>
                {(branchesQuery.data ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Delivery fee (PKR)</Label>
              <Input {...zoneForm.register("feeRupees")} />
            </div>
            <div>
              <Label>Min order (PKR)</Label>
              <Input {...zoneForm.register("minOrderRupees")} />
            </div>
            <div className="sm:col-span-2">
              <Label>Coverage note (demo / until geo)</Label>
              <Textarea {...zoneForm.register("polygonNote")} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...zoneForm.register("isActive")} /> Active
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" loading={saveZone.isPending}>
              Save zone
            </Button>
            <Button type="button" variant="ghost" onClick={() => setZoneFormOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-display text-xl text-espresso">Branches</h2>
          {branchesQuery.isError ? (
            <EmptyState title="Could not load branches" />
          ) : (branchesQuery.data ?? []).length === 0 ? (
            <EmptyState title="No branches" />
          ) : (
            <ul className="space-y-2">
              {(branchesQuery.data ?? []).map((b) => (
                <li
                  key={b.id}
                  className="rounded-xl border border-espresso/10 bg-cream-soft p-4 shadow-soft"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{b.name}</p>
                      <p className="text-xs text-espresso/55">
                        {b.address.area}, {b.address.city}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {b.orderingPaused ? (
                          <Badge className="bg-amber-100 text-amber-900">Paused</Badge>
                        ) : null}
                        {!b.isActive ? (
                          <Badge className="bg-rose-100 text-rose-800">Inactive</Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-900">Active</Badge>
                        )}
                        {b.isPickupOpen ? (
                          <Badge className="bg-cream-deep">Pickup</Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openBranchEdit(b)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-700"
                        onClick={() => {
                          if (confirm(`Delete branch ${b.name}?`)) {
                            void deleteBranch(b.id)
                              .then(() => {
                                toast.success("Deleted");
                                void queryClient.invalidateQueries({ queryKey: ["branches"] });
                              })
                              .catch((err) =>
                                toast.error(
                                  err instanceof ApiError ? err.message : "Delete failed"
                                )
                              );
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-display text-xl text-espresso">Delivery zones</h2>
          {zonesQuery.isError ? (
            <EmptyState title="Could not load zones" />
          ) : (zonesQuery.data ?? []).length === 0 ? (
            <EmptyState title="No zones" />
          ) : (
            <ul className="space-y-2">
              {(zonesQuery.data ?? []).map((z) => (
                <li
                  key={z.id}
                  className="rounded-xl border border-espresso/10 bg-cream-soft p-4 shadow-soft"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{z.name}</p>
                      <p className="text-xs text-espresso/55">
                        {branchName(z.branchId)} · Fee {formatPkr(z.feeMinor)} · Min{" "}
                        {formatPkr(z.minOrderMinor)}
                      </p>
                      {z.polygonNote ? (
                        <p className="mt-1 text-xs text-espresso/45">{z.polygonNote}</p>
                      ) : null}
                      {!z.isActive ? (
                        <Badge className="mt-2 bg-rose-100 text-rose-800">Inactive</Badge>
                      ) : null}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingZone(z);
                          zoneForm.reset({
                            name: z.name,
                            branchId: z.branchId,
                            feeRupees: String(fromMinor(z.feeMinor)),
                            minOrderRupees: String(fromMinor(z.minOrderMinor)),
                            polygonNote: z.polygonNote ?? "",
                            isActive: z.isActive,
                          });
                          setZoneFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-700"
                        onClick={() => {
                          if (confirm(`Delete zone ${z.name}?`)) {
                            void deleteDeliveryZone(z.id)
                              .then(() => {
                                toast.success("Deleted");
                                void queryClient.invalidateQueries({
                                  queryKey: ["delivery-zones"],
                                });
                              })
                              .catch((err) =>
                                toast.error(
                                  err instanceof ApiError ? err.message : "Delete failed"
                                )
                              );
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
