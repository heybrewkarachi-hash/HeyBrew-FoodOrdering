"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMenu } from "@/lib/api";
import { useOrdering } from "@/context/ordering-context";

export function useMenu() {
  const { session } = useOrdering();
  return useQuery({
    queryKey: [
      "menu",
      session.branchId,
      session.deliveryZoneId,
      session.type,
    ],
    queryFn: () =>
      fetchMenu({
        branchId: session.branchId,
        deliveryZoneId:
          session.type === "delivery" ? session.deliveryZoneId : null,
      }),
    staleTime: 60_000,
  });
}
