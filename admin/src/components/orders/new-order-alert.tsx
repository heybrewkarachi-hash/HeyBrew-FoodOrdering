"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import {
  useOrdersSocket,
  useSoundAlert,
  type NewOrderSocketPayload,
} from "@/hooks/useOrdersSocket";
import { listBranches, updateOrderStatus } from "@/lib/admin-api";
import { formatPkr } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/field";

const ALERT_SECONDS = 30;

function formatAddress(
  order: NewOrderSocketPayload,
  branchName?: string
): string {
  if (order.type === "pickup") {
    return `Pickup · ${branchName ?? `branch ${order.branchId.slice(-6)}`}`;
  }
  const a = order.address;
  if (!a) return "Delivery";
  return [a.line1, a.line2, a.area, a.city, a.landmark]
    .filter(Boolean)
    .join(", ");
}

type AlertPanelProps = {
  order: NewOrderSocketPayload;
  branchName?: string;
  onDone: () => void;
  playSound: () => void;
};

function NewOrderAlertPanel({
  order,
  branchName,
  onDone,
  playSound,
}: AlertPanelProps) {
  const [secondsLeft, setSecondsLeft] = useState(ALERT_SECONDS);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const doneRef = useRef(false);
  const remainingRef = useRef(ALERT_SECONDS);
  const queryClient = useQueryClient();

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

  useEffect(() => {
    playSound();
  }, [order.orderId, playSound]);

  useEffect(() => {
    if (cancelling || submitting) return;
    const tickStart = Date.now();
    const startLeft = remainingRef.current;
    const id = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - tickStart) / 1000);
      const left = Math.max(0, startLeft - elapsed);
      remainingRef.current = left;
      setSecondsLeft(left);
      if (left <= 0) {
        window.clearInterval(id);
        finish();
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [order.orderId, cancelling, submitting, finish]);

  async function accept() {
    setSubmitting(true);
    setError(null);
    try {
      await updateOrderStatus(order.orderId, {
        status: "confirmed",
        version: order.version,
      });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      finish();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to accept order");
      setSubmitting(false);
    }
  }

  async function confirmCancel() {
    const reason = cancelReason.trim();
    if (!reason) {
      setError("Cancel reason is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updateOrderStatus(order.orderId, {
        status: "cancelled",
        version: order.version,
        cancelReason: reason,
      });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      finish();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to cancel order");
      setSubmitting(false);
    }
  }

  const progress = (secondsLeft / ALERT_SECONDS) * 100;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-espresso/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`New order ${order.orderNumber}`}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-espresso/10 bg-cream-soft shadow-2xl">
        <div className="h-2 w-full bg-espresso/10">
          <div
            className="h-full bg-emerald-500 transition-[width] duration-200 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                New order · {secondsLeft}s
              </p>
              <p className="mt-1 font-display text-3xl font-bold text-espresso sm:text-4xl">
                {order.orderNumber}
              </p>
            </div>
            <span className="rounded-md bg-espresso/8 px-2.5 py-1 text-xs font-semibold uppercase text-espresso">
              {order.type}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-espresso/80">
            {formatAddress(order, branchName)}
          </p>

          <div className="rounded-lg border border-espresso/10 bg-white/60 p-3">
            <ul className="space-y-1.5">
              {order.items.map((item, i) => (
                <li
                  key={`${item.productName}-${i}`}
                  className="flex justify-between gap-3 text-sm text-espresso"
                >
                  <span>
                    <span className="font-semibold">{item.quantity}×</span>{" "}
                    {item.productName}
                  </span>
                  <span className="shrink-0 tabular-nums text-espresso/70">
                    {formatPkr(item.lineTotalMinor)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-espresso/10 pt-2 text-sm font-semibold text-espresso">
              <span>Total</span>
              <span className="tabular-nums">
                {formatPkr(order.totals.totalMinor)}
              </span>
            </div>
            {order.totals.deliveryFeeMinor > 0 ? (
              <p className="mt-1 text-right text-xs text-espresso/55">
                incl. delivery {formatPkr(order.totals.deliveryFeeMinor)}
              </p>
            ) : null}
          </div>

          <div className="text-sm text-espresso/80">
            <p className="font-medium text-espresso">{order.customer.name}</p>
            <p className="tabular-nums">{order.customer.phone}</p>
          </div>

          {error ? (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          ) : null}

          {cancelling ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="new-order-cancel-reason">Cancel reason</Label>
                <textarea
                  id="new-order-cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full rounded-md border border-espresso/20 bg-white px-3 py-2 text-sm text-espresso outline-none focus:border-espresso/40 focus:ring-2 focus:ring-espresso/20"
                  placeholder="Why is this order being cancelled?"
                  disabled={submitting}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={submitting}
                  onClick={() => {
                    setCancelling(false);
                    setError(null);
                  }}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="flex-1"
                  loading={submitting}
                  disabled={submitting || !cancelReason.trim()}
                  onClick={() => void confirmCancel()}
                >
                  Confirm cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="danger"
                className="flex-1"
                disabled={submitting}
                onClick={() => setCancelling(true)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                loading={submitting}
                disabled={submitting}
                onClick={() => void accept()}
              >
                Accept
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Global FIFO queue of new-order confirm popups (all logged-in admin pages). */
export function NewOrderAlertHost() {
  const [queue, setQueue] = useState<NewOrderSocketPayload[]>([]);
  const sound = useSoundAlert();
  const queryClient = useQueryClient();
  const seenRef = useRef<Set<string>>(new Set());

  const branchesQuery = useQuery({
    queryKey: ["branches"],
    queryFn: listBranches,
    staleTime: 60_000,
  });

  const enqueue = useCallback(
    (payload: NewOrderSocketPayload) => {
      if (!payload?.orderId) return;
      if (seenRef.current.has(payload.orderId)) return;
      seenRef.current.add(payload.orderId);
      setQueue((prev) => [...prev, payload]);
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    [queryClient]
  );

  useOrdersSocket(
    {
      onNewOrder: enqueue,
      onOrderUpdated: () => {
        void queryClient.invalidateQueries({ queryKey: ["orders"] });
      },
    },
    true
  );

  const current = queue[0] ?? null;
  const branchName = current
    ? branchesQuery.data?.find((b) => b.id === current.branchId)?.name
    : undefined;

  const advance = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  return (
    <>
      {!sound.enabled ? (
        <div className="fixed bottom-4 right-4 z-[70] max-w-xs rounded-lg border border-espresso/15 bg-cream-soft p-3 shadow-lg">
          <p className="text-xs text-espresso/70">
            Browsers block audio until you interact.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => void sound.enable()}
          >
            <Bell className="h-3.5 w-3.5" />
            Enable sound alerts
          </Button>
        </div>
      ) : null}

      {current ? (
        <NewOrderAlertPanel
          key={current.orderId}
          order={current}
          branchName={branchName}
          onDone={advance}
          playSound={sound.play}
        />
      ) : null}
    </>
  );
}
