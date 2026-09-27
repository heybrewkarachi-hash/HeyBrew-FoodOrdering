"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { trackOrder } from "@/lib/api";
import { formatRs } from "@/lib/format";
import { Suspense } from "react";

function TrackInner({ orderNumber }: { orderNumber: string }) {
  const search = useSearchParams();
  const token = search.get("token") || "";

  const { data, error, isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["track", orderNumber, token],
    queryFn: () => trackOrder(orderNumber, token),
    enabled: Boolean(orderNumber && token),
    refetchInterval: 8000,
  });

  if (!token) {
    return (
      <p className="p-8 text-center text-red-700">
        Missing tracking token. Order number alone cannot open an order.
      </p>
    );
  }

  if (isLoading) return <p className="p-8 text-center">Loading order…</p>;
  if (error || !data) {
    return (
      <p className="p-8 text-center text-red-700">
        Order not found or token invalid.
      </p>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="font-display text-2xl font-extrabold">Order confirmed</h1>
      <p className="mt-1 text-sm text-muted">
        #{data.orderNumber} · Updated{" "}
        {new Date(dataUpdatedAt).toLocaleTimeString()}
      </p>

      <div className="mt-6 space-y-4 rounded-card bg-surface p-5">
        <p className="text-sm font-semibold capitalize">
          Status: {data.status.replaceAll("_", " ")}
        </p>
        <p className="text-sm">
          Payment: {data.paymentStatus} ({data.paymentMethod})
        </p>
        {data.etaNote ? (
          <p className="text-xs text-muted">{data.etaNote}</p>
        ) : null}
        <ul className="space-y-2 border-t border-espresso/10 pt-3 text-sm">
          {data.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span>
                {item.quantity}× {item.name}
              </span>
              <span>{formatRs(item.lineTotalMinor)}</span>
            </li>
          ))}
        </ul>
        <p className="flex justify-between font-extrabold">
          <span>Total</span>
          <span>{formatRs(data.totals.grandTotalMinor)}</span>
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="w-full rounded-full border border-espresso/20 py-2 text-sm font-semibold"
        >
          Refresh status
        </button>
      </div>
    </main>
  );
}

export default function OrderTrackPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = use(params);
  return (
    <Suspense fallback={<p className="p-8 text-center">Loading…</p>}>
      <TrackInner orderNumber={decodeURIComponent(orderNumber)} />
    </Suspense>
  );
}
