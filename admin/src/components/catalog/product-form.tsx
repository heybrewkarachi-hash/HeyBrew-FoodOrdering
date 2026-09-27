"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState } from "react";
import {
  createProduct,
  listBranches,
  listCategories,
  signUpload,
  updateProduct,
  uploadToCloudinary,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { parseRupeesToMinor, formatPkr, fromMinor } from "@/lib/money";
import { slugify } from "@/lib/utils";
import type { Product } from "@/types";
import { Badge, PageHeader, SeedBadge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/field";

const variantSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  priceDeltaMinor: z.number().int(),
  isDefault: z.boolean().optional(),
});

const optionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  priceDeltaMinor: z.number().int(),
  isDefault: z.boolean().optional(),
});

const groupSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  minSelect: z.number().int().min(0),
  maxSelect: z.number().int().min(1),
  required: z.boolean(),
  options: z.array(optionSchema),
});

const formSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category required"),
  priceRupees: z.string().min(1),
  featured: z.boolean(),
  isArchived: z.boolean(),
  availableBranchIds: z.array(z.string()),
  soldOutBranchIds: z.array(z.string()),
  variants: z.array(variantSchema),
  modifierGroups: z.array(groupSchema),
  images: z.array(
    z.object({
      publicId: z.string(),
      url: z.string(),
      alt: z.string().optional().nullable(),
    })
  ),
});

type FormValues = z.infer<typeof formSchema>;

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function productToForm(p?: Product | null): FormValues {
  if (!p) {
    return {
      name: "",
      slug: "",
      description: "",
      categoryId: "",
      priceRupees: "",
      featured: false,
      isArchived: false,
      availableBranchIds: [],
      soldOutBranchIds: [],
      variants: [],
      modifierGroups: [],
      images: [],
    };
  }
  return {
    name: p.name,
    slug: p.slug,
    description: p.description ?? "",
    categoryId: p.categoryId,
    priceRupees: String(fromMinor(p.priceMinor)),
    featured: p.featured,
    isArchived: p.isArchived,
    availableBranchIds: p.availableBranchIds ?? [],
    soldOutBranchIds: p.soldOutBranchIds ?? [],
    variants: p.variants ?? [],
    modifierGroups: p.modifierGroups ?? [],
    images: p.images ?? [],
  };
}

export function ProductForm({ product }: { product?: Product | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const isEdit = Boolean(product?.id);

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const branchesQuery = useQuery({ queryKey: ["branches"], queryFn: listBranches });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: productToForm(product),
  });

  const variants = useFieldArray({ control: form.control, name: "variants" });
  const groups = useFieldArray({ control: form.control, name: "modifierGroups" });

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const body = {
        name: values.name,
        slug: values.slug,
        description: values.description,
        categoryId: values.categoryId,
        priceMinor: parseRupeesToMinor(values.priceRupees),
        featured: values.featured,
        isArchived: values.isArchived,
        availableBranchIds: values.availableBranchIds,
        soldOutBranchIds: values.soldOutBranchIds,
        variants: values.variants,
        modifierGroups: values.modifierGroups,
        images: values.images,
      };
      if (isEdit && product) return updateProduct(product.id, body);
      return createProduct(body);
    },
    onSuccess: (saved) => {
      toast.success(isEdit ? "Product updated" : "Product created");
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push(`/products/${saved.id}`);
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Save failed"),
  });

  const onUpload = async (file: File) => {
    setUploading(true);
    try {
      const sign = await signUpload();
      const uploaded = await uploadToCloudinary(file, sign);
      const images = form.getValues("images");
      form.setValue("images", [
        ...images,
        { publicId: uploaded.publicId, url: uploaded.url, alt: form.getValues("name") },
      ]);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const toggleId = (field: "availableBranchIds" | "soldOutBranchIds", id: string) => {
    const current = form.getValues(field);
    form.setValue(
      field,
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? product!.name : "New product"}
        description="Prices are entered in PKR and stored as paisa on the server."
        actions={
          product?.developmentSeed ? <SeedBadge /> : null
        }
      />

      <form
        className="space-y-6"
        onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
      >
        <section className="rounded-xl border border-espresso/10 bg-cream-soft p-5 shadow-soft">
          <h2 className="font-display text-lg">Basics</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Name</Label>
              <Input
                {...form.register("name")}
                onBlur={(e) => {
                  if (!isEdit && !form.getValues("slug")) {
                    form.setValue("slug", slugify(e.target.value));
                  }
                }}
              />
              <FieldError message={form.formState.errors.name?.message} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input {...form.register("slug")} />
              <FieldError message={form.formState.errors.slug?.message} />
            </div>
            <div>
              <Label>Category</Label>
              <Select {...form.register("categoryId")}>
                <option value="">Select…</option>
                {(categoriesQuery.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <FieldError message={form.formState.errors.categoryId?.message} />
            </div>
            <div>
              <Label>Base price (PKR)</Label>
              <Input {...form.register("priceRupees")} inputMode="decimal" placeholder="e.g. 450" />
              <FieldError message={form.formState.errors.priceRupees?.message} />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Textarea {...form.register("description")} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register("featured")} /> Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register("isArchived")} /> Archived
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-espresso/10 bg-cream-soft p-5 shadow-soft">
          <h2 className="font-display text-lg">Images</h2>
          <p className="mt-1 text-xs text-espresso/50">
            Upload via signed Cloudinary params from <code>/api/v1/admin/uploads/sign</code>.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {form.watch("images").map((img, i) => (
              <div key={img.publicId} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.alt ?? ""}
                  className="h-24 w-24 rounded-lg object-cover"
                />
                <button
                  type="button"
                  className="absolute -right-2 -top-2 rounded-full bg-rose-700 px-1.5 text-xs text-white"
                  onClick={() =>
                    form.setValue(
                      "images",
                      form.getValues("images").filter((_, idx) => idx !== i)
                    )
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <Input
            type="file"
            accept="image/*"
            className="mt-3"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onUpload(file);
              e.target.value = "";
            }}
          />
          {uploading ? <p className="mt-1 text-xs text-espresso/50">Uploading…</p> : null}
        </section>

        <section className="rounded-xl border border-espresso/10 bg-cream-soft p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg">Variants</h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                variants.append({
                  id: uid("var"),
                  name: "",
                  priceDeltaMinor: 0,
                  isDefault: variants.fields.length === 0,
                })
              }
            >
              Add variant
            </Button>
          </div>
          <div className="mt-3 space-y-3">
            {variants.fields.map((field, index) => (
              <div key={field.id} className="grid gap-2 sm:grid-cols-4">
                <Input
                  placeholder="Name"
                  {...form.register(`variants.${index}.name`)}
                />
                <Input
                  type="number"
                  placeholder="Delta (paisa)"
                  {...form.register(`variants.${index}.priceDeltaMinor`, {
                    valueAsNumber: true,
                  })}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...form.register(`variants.${index}.isDefault`)} />
                  Default
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-rose-700"
                  onClick={() => variants.remove(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-espresso/10 bg-cream-soft p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg">Modifier groups</h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                groups.append({
                  id: uid("grp"),
                  name: "",
                  minSelect: 0,
                  maxSelect: 1,
                  required: false,
                  options: [{ id: uid("opt"), name: "", priceDeltaMinor: 0 }],
                })
              }
            >
              Add group
            </Button>
          </div>
          <div className="mt-3 space-y-4">
            {groups.fields.map((group, gi) => (
              <div key={group.id} className="rounded-lg border border-espresso/10 p-3">
                <div className="grid gap-2 sm:grid-cols-4">
                  <Input placeholder="Group name" {...form.register(`modifierGroups.${gi}.name`)} />
                  <Input
                    type="number"
                    placeholder="Min"
                    {...form.register(`modifierGroups.${gi}.minSelect`, { valueAsNumber: true })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    {...form.register(`modifierGroups.${gi}.maxSelect`, { valueAsNumber: true })}
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" {...form.register(`modifierGroups.${gi}.required`)} />
                    Required
                  </label>
                </div>
                <ModifierOptions form={form} groupIndex={gi} />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="mt-2 text-rose-700"
                  onClick={() => groups.remove(gi)}
                >
                  Remove group
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-espresso/10 bg-cream-soft p-5 shadow-soft">
          <h2 className="font-display text-lg">Branch availability</h2>
          <p className="mt-1 text-xs text-espresso/50">
            Empty “available” list typically means all active branches (server rule). Mark sold-out
            per branch without removing from menu.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-espresso/55">Available at</p>
              <div className="space-y-2">
                {(branchesQuery.data ?? []).map((b) => (
                  <label key={b.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.watch("availableBranchIds").includes(b.id)}
                      onChange={() => toggleId("availableBranchIds", b.id)}
                    />
                    {b.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-espresso/55">Sold out at</p>
              <div className="space-y-2">
                {(branchesQuery.data ?? []).map((b) => (
                  <label key={b.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.watch("soldOutBranchIds").includes(b.id)}
                      onChange={() => toggleId("soldOutBranchIds", b.id)}
                    />
                    {b.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="flex gap-2">
          <Button type="submit" loading={saveMutation.isPending}>
            {isEdit ? "Save changes" : "Create product"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push("/products")}>
            Back
          </Button>
          {isEdit && product ? (
            <Badge className="ml-auto self-center bg-cream-deep">
              Base {formatPkr(product.priceMinor)}
            </Badge>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function ModifierOptions({
  form,
  groupIndex,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
  groupIndex: number;
}) {
  const options = useFieldArray({
    control: form.control,
    name: `modifierGroups.${groupIndex}.options`,
  });

  return (
    <div className="mt-3 space-y-2 border-t border-espresso/8 pt-3">
      {options.fields.map((opt, oi) => (
        <div key={opt.id} className="grid gap-2 sm:grid-cols-3">
          <Input
            placeholder="Option"
            {...form.register(`modifierGroups.${groupIndex}.options.${oi}.name`)}
          />
          <Input
            type="number"
            placeholder="Delta paisa"
            {...form.register(`modifierGroups.${groupIndex}.options.${oi}.priceDeltaMinor`, {
              valueAsNumber: true,
            })}
          />
          <Button type="button" size="sm" variant="ghost" onClick={() => options.remove(oi)}>
            Remove
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() =>
          options.append({ id: uid("opt"), name: "", priceDeltaMinor: 0 })
        }
      >
        Add option
      </Button>
    </div>
  );
}
