"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import {
  archiveProduct,
  listCategories,
  listProducts,
  reorderProducts,
  updateProduct,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { formatPkr } from "@/lib/money";
import { Badge, EmptyState, PageHeader, SeedBadge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  const productsQuery = useQuery({
    queryKey: ["products", q, categoryId, showArchived],
    queryFn: () =>
      listProducts({
        q: q || undefined,
        categoryId: categoryId || undefined,
        archived: showArchived,
        limit: 100,
      }),
  });

  const catName = (id: string) =>
    categoriesQuery.data?.find((c) => c.id === id)?.name ?? "—";

  const sorted = [...(productsQuery.data?.items ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  const toggleFeatured = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) =>
      updateProduct(id, { featured }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Update failed"),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveProduct(id),
    onSuccess: () => {
      toast.success("Product archived");
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Archive failed"),
  });

  const move = async (index: number, dir: -1 | 1) => {
    const items = [...sorted];
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    try {
      await reorderProducts(items.map((p) => p.id));
      toast.success("Order saved");
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Reorder failed");
    }
  };

  return (
    <div>
      <PageHeader
        title="Products"
        description="Catalog with variants, modifiers, branch availability, and Cloudinary images."
        actions={
          <Link href="/products/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add product
            </Button>
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="prod-q">Search</Label>
          <Input
            id="prod-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name or keyword"
          />
        </div>
        <div>
          <Label htmlFor="prod-cat">Category</Label>
          <Select
            id="prod-cat"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">All</option>
            {(categoriesQuery.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm text-espresso">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Show archived
        </label>
      </div>

      {productsQuery.isError ? (
        <EmptyState title="Could not load products" />
      ) : sorted.length === 0 && !productsQuery.isLoading ? (
        <EmptyState title="No products" description="Add a product or adjust filters." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-espresso/10 bg-cream-soft/80 shadow-soft">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-cream-deep/60 text-xs uppercase tracking-wide text-espresso/55">
              <tr>
                <th className="px-3 py-3 font-medium">Order</th>
                <th className="px-3 py-3 font-medium">Product</th>
                <th className="px-3 py-3 font-medium">Category</th>
                <th className="px-3 py-3 font-medium">Price</th>
                <th className="px-3 py-3 font-medium">Flags</th>
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/8">
              {sorted.map((p, index) => (
                <tr key={p.id} className="hover:bg-cream-deep/30">
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="rounded p-1 hover:bg-cream-deep"
                        onClick={() => void move(index, -1)}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 hover:bg-cream-deep"
                        onClick={() => void move(index, 1)}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/products/${p.id}`}
                      className="font-medium text-espresso hover:underline"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-espresso/45">{p.slug}</p>
                  </td>
                  <td className="px-3 py-2">{catName(p.categoryId)}</td>
                  <td className="px-3 py-2">{formatPkr(p.priceMinor)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {p.featured ? (
                        <Badge className="bg-caramel/20 text-espresso">Featured</Badge>
                      ) : null}
                      {p.isArchived ? (
                        <Badge className="bg-rose-100 text-rose-800">Archived</Badge>
                      ) : null}
                      {p.developmentSeed ? <SeedBadge /> : null}
                      {p.soldOutBranchIds?.length ? (
                        <Badge className="bg-amber-100 text-amber-900">
                          Sold out ({p.soldOutBranchIds.length})
                        </Badge>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/products/${p.id}`}>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          toggleFeatured.mutate({ id: p.id, featured: !p.featured })
                        }
                      >
                        {p.featured ? "Unfeature" : "Feature"}
                      </Button>
                      {!p.isArchived ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-700"
                          onClick={() => {
                            if (confirm(`Archive “${p.name}”?`)) {
                              archiveMutation.mutate(p.id);
                            }
                          }}
                        >
                          Archive
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
