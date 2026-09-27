"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createCategory,
  deleteCategory,
  listCategories,
  reorderCategories,
  updateCategory,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { slugify } from "@/lib/utils";
import type { Category } from "@/types";
import { Badge, EmptyState, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/field";

const schema = z.object({
  name: z.string().min(2, "Name required"),
  slug: z.string().min(2, "Slug required"),
  description: z.string().optional(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);

  const listQuery = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "", description: "", isActive: true },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: "", slug: "", description: "", isActive: true });
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    form.reset({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      isActive: cat.isActive,
    });
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (editing) return updateCategory(editing.id, values);
      return createCategory(values);
    },
    onSuccess: () => {
      toast.success(editing ? "Category updated" : "Category created");
      setShowForm(false);
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Save failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      toast.success("Category deleted");
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Delete failed"),
  });

  const move = async (index: number, dir: -1 | 1) => {
    const items = [...(listQuery.data ?? [])].sort(
      (a, b) => a.displayOrder - b.displayOrder
    );
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const swapped = [...items];
    [swapped[index], swapped[target]] = [swapped[target], swapped[index]];
    try {
      await reorderCategories(swapped.map((c) => c.id));
      toast.success("Order saved");
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Reorder failed");
    }
  };

  const sorted = [...(listQuery.data ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Menu categories — reorder with the arrows. Server enforces catalog roles."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add category
          </Button>
        }
      />

      {showForm ? (
        <form
          className="mb-6 rounded-xl border border-espresso/10 bg-cream-soft p-5 shadow-soft"
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
        >
          <h2 className="font-display text-lg text-espresso">
            {editing ? "Edit category" : "New category"}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                {...form.register("name")}
                onBlur={(e) => {
                  if (!editing && !form.getValues("slug")) {
                    form.setValue("slug", slugify(e.target.value));
                  }
                }}
              />
              <FieldError message={form.formState.errors.name?.message} />
            </div>
            <div>
              <Label htmlFor="cat-slug">Slug</Label>
              <Input id="cat-slug" {...form.register("slug")} />
              <FieldError message={form.formState.errors.slug?.message} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea id="cat-desc" {...form.register("description")} />
            </div>
            <label className="flex items-center gap-2 text-sm text-espresso">
              <input type="checkbox" {...form.register("isActive")} className="rounded" />
              Active
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" loading={saveMutation.isPending}>
              Save
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {listQuery.isError ? (
        <EmptyState title="Could not load categories" />
      ) : sorted.length === 0 && !listQuery.isLoading ? (
        <EmptyState title="No categories yet" description="Create your first menu category." />
      ) : (
        <ul className="space-y-2">
          {sorted.map((cat, index) => (
            <li
              key={cat.id}
              className="flex items-center gap-3 rounded-xl border border-espresso/10 bg-cream-soft/90 px-4 py-3 shadow-soft"
            >
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  className="rounded p-1 text-espresso/50 hover:bg-cream-deep"
                  onClick={() => void move(index, -1)}
                  aria-label="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded p-1 text-espresso/50 hover:bg-cream-deep"
                  onClick={() => void move(index, 1)}
                  aria-label="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-espresso">{cat.name}</p>
                  {!cat.isActive ? (
                    <Badge className="bg-rose-100 text-rose-800">Inactive</Badge>
                  ) : null}
                </div>
                <p className="truncate text-xs text-espresso/50">{cat.slug}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => openEdit(cat)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-rose-700"
                onClick={() => {
                  if (confirm(`Delete category “${cat.name}”?`)) {
                    deleteMutation.mutate(cat.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
