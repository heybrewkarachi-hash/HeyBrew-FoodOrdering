"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { acquireAdminSocket, releaseAdminSocket } from "@/lib/socket";
import type { OrderStatus, OrderType } from "@heybrew/shared";

export type SocketStatus = "connecting" | "connected" | "disconnected";

export type NewOrderSocketPayload = {
  orderId: string;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  version: number;
  createdAt?: string;
  at?: string;
  customer: {
    name: string;
    phone: string;
  };
  address: {
    line1: string;
    line2?: string | null;
    area: string;
    city: string;
    landmark?: string | null;
  } | null;
  branchId: string;
  items: Array<{
    productName: string;
    quantity: number;
    lineTotalMinor: number;
  }>;
  totals: {
    subtotalMinor: number;
    deliveryFeeMinor: number;
    discountMinor: number;
    totalMinor: number;
  };
};

type OrdersSocketHandlers = {
  onNewOrder?: (payload: NewOrderSocketPayload) => void;
  onOrderUpdated?: () => void;
};

/**
 * Joins Socket.IO room `admin:orders` via `admin:join`.
 * Listens for server events `order:new` and `order:updated`.
 */
export function useOrdersSocket(
  handlers: OrdersSocketHandlers | (() => void),
  enabled = true
) {
  const [status, setStatus] = useState<SocketStatus>("disconnected");
  const handlersRef = useRef<OrdersSocketHandlers>(
    typeof handlers === "function"
      ? { onNewOrder: () => (handlers as () => void)(), onOrderUpdated: handlers }
      : handlers
  );

  useEffect(() => {
    handlersRef.current =
      typeof handlers === "function"
        ? {
            onNewOrder: () => (handlers as () => void)(),
            onOrderUpdated: handlers,
          }
        : handlers;
  }, [handlers]);

  useEffect(() => {
    if (!enabled) {
      setStatus("disconnected");
      return;
    }

    const socket = acquireAdminSocket();
    setStatus(socket.connected ? "connected" : "connecting");

    const onConnect = () => {
      socket.emit(
        "admin:join",
        {},
        (ack?: { ok?: boolean; error?: string }) => {
          if (ack?.ok) setStatus("connected");
          else setStatus("disconnected");
        }
      );
    };
    const onDisconnect = () => setStatus("disconnected");
    const onNew = (payload: NewOrderSocketPayload) =>
      handlersRef.current.onNewOrder?.(payload);
    const onUpdated = () => handlersRef.current.onOrderUpdated?.();

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("order:new", onNew);
    socket.on("order:updated", onUpdated);
    if (socket.connected) onConnect();
    else socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("order:new", onNew);
      socket.off("order:updated", onUpdated);
      releaseAdminSocket();
    };
  }, [enabled]);

  return { status };
}

export function useSoundAlert() {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);

  const enable = useCallback(async () => {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = ctxRef.current ?? new Ctx();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") await ctx.resume();
    setEnabled(true);
    // Soft chime to confirm unlock
    playTone(ctx, 660, 0.08);
    setTimeout(() => playTone(ctx, 880, 0.1), 100);
  }, []);

  const play = useCallback(() => {
    if (!enabled || !ctxRef.current) return;
    playTone(ctxRef.current, 740, 0.12);
    setTimeout(() => {
      if (ctxRef.current) playTone(ctxRef.current, 980, 0.14);
    }, 120);
  }, [enabled]);

  return { enabled, enable, play };
}

function playTone(ctx: AudioContext, freq: number, duration: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.value = 0.0001;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}
