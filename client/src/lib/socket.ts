import { io, type Socket } from "socket.io-client";
import type { OrderStatus } from "@heybrew/shared";

const SOCKET_URL = () =>
  (
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000"
  ).replace(/\/$/, "");

export type OrderStatusEvent = {
  orderId: string;
  status: OrderStatus;
  at: string;
  note?: string;
};

type OrderUpdatedPayload = {
  orderId: string;
  orderNumber?: string;
  status: OrderStatus;
  version?: number;
  at?: string;
};

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL(), {
      autoConnect: false,
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
  }
  return socket;
}

/**
 * Joins private room `order:{id}` via `order:join` + access token.
 * Listens for server event `order:updated`.
 * Ref-counted so multiple mounts share one socket without tearing it down early.
 */
let joinRefCount = 0;

export function subscribeOrderTracking(
  orderId: string,
  accessToken: string,
  onStatus: (event: OrderStatusEvent) => void,
  onConnectionChange?: (connected: boolean) => void
): () => void {
  const s = getSocket();
  joinRefCount += 1;

  const handleUpdated = (payload: OrderUpdatedPayload) => {
    if (payload.orderId !== orderId || !payload.status) return;
    onStatus({
      orderId: payload.orderId,
      status: payload.status,
      at: payload.at ?? new Date().toISOString(),
    });
  };

  const handleConnect = () => {
    s.emit(
      "order:join",
      { orderId, accessToken },
      (ack?: { ok?: boolean }) => {
        onConnectionChange?.(!!ack?.ok);
      }
    );
  };

  const handleDisconnect = () => {
    onConnectionChange?.(false);
  };

  s.on("order:updated", handleUpdated);
  s.on("connect", handleConnect);
  s.on("disconnect", handleDisconnect);

  if (!s.connected) s.connect();
  else handleConnect();

  return () => {
    joinRefCount = Math.max(0, joinRefCount - 1);
    s.off("order:updated", handleUpdated);
    s.off("connect", handleConnect);
    s.off("disconnect", handleDisconnect);
    if (joinRefCount === 0) {
      s.disconnect();
    }
  };
}
