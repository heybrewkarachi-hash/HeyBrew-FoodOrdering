"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getProduct } from "@/lib/admin-api";
import { ProductForm } from "@/components/catalog/product-form";
import { EmptyState } from "@/components/ui/card";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const query = useQuery({
    queryKey: ["product", params.id],
    queryFn: () => getProduct(params.id),
  });

  if (query.isLoading) {
    return <p className="text-sm text-espresso/50">Loading product…</p>;
  }
  if (query.isError || !query.data) {
    return <EmptyState title="Product not found" />;
  }

  return <ProductForm key={query.data.id} product={query.data} />;
}
