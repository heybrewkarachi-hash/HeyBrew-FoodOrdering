"use client";

import { useQuery } from "@tanstack/react-query";
import { trackOrder } from "@/lib/api";
import { isTerminalStatus } from "@/lib/order-status";

const POLL_MS = 15_000;

/** Lightweight status fetch for Orders list cards (no Socket.IO). */
export function useOrderStatusPoll(orderNumber: string, token: string) {
  return useQuery({
    queryKey: ["order-status-poll", orderNumber, token],
    queryFn: () => trackOrder(orderNumber, token),
    enabled: !!orderNumber && !!token,
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      if (status && isTerminalStatus(status)) return false;
      return POLL_MS;
    },
    retry: 1,
    staleTime: 8_000,
  });
}
