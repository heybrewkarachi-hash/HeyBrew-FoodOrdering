"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { OrderStatus } from "@heybrew/shared";
import { trackOrder } from "@/lib/api";
import { subscribeOrderTracking } from "@/lib/socket";
import type { TrackedOrder } from "@/lib/types";

const POLL_MS = 12_000;

/**
 * @param orderId Mongo id — used for Socket.IO room join
 * @param orderNumber Human order number — used for HTTP track API
 * @param token Order access token
 */
export function useOrderTracking(
  orderId: string,
  orderNumber: string,
  token: string
) {
  const [liveStatus, setLiveStatus] = useState<OrderStatus | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const query = useQuery({
    queryKey: ["track-order", orderNumber, token],
    queryFn: () => trackOrder(orderNumber, token),
    enabled: !!orderNumber && !!token,
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      if (
        status === "delivered" ||
        status === "collected" ||
        status === "cancelled"
      ) {
        return false;
      }
      return socketConnected ? POLL_MS * 2 : POLL_MS;
    },
    retry: 1,
  });

  useEffect(() => {
    if (!orderId || !token) return;

    let cleaned = false;
    const unsub = subscribeOrderTracking(
      orderId,
      token,
      (event) => {
        if (cleaned) return;
        setLiveStatus(event.status);
        void query.refetch();
      },
      (connected) => {
        if (!cleaned) setSocketConnected(connected);
      }
    );

    return () => {
      cleaned = true;
      setSocketConnected(false);
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, token]);

  const order: TrackedOrder | undefined = query.data
    ? liveStatus
      ? { ...query.data, status: liveStatus }
      : query.data
    : undefined;

  return {
    ...query,
    order,
    liveStatus,
    socketConnected,
  };
}
