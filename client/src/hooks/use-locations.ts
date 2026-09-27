"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBranches, fetchDeliveryZones } from "@/lib/api";

export function useBranches() {
  return useQuery({
    queryKey: ["branches"],
    queryFn: fetchBranches,
    staleTime: 120_000,
  });
}

export function useDeliveryZones(branchId?: string | null) {
  return useQuery({
    queryKey: ["delivery-zones", branchId],
    queryFn: () => fetchDeliveryZones(branchId || undefined),
    staleTime: 120_000,
  });
}
