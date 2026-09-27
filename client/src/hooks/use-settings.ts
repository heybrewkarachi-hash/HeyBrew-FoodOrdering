"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPublicSettings } from "@/lib/api";

export function usePublicSettings() {
  return useQuery({
    queryKey: ["public-settings"],
    queryFn: fetchPublicSettings,
    staleTime: 120_000,
  });
}
