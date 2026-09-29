"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { OrderTracker } from "@/components/track/order-tracker";

function TrackInner({ orderNumber }: { orderNumber: string }) {
  const search = useSearchParams();
  const token = search.get("token") || "";
  const orderId = search.get("id") || orderNumber;

  if (!token) {
    return (
      <p className="p-8 text-center text-red-700">
        Missing tracking token. Order number alone cannot open an order.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <OrderTracker
        orderId={orderId}
        orderNumber={orderNumber}
        token={token}
      />
    </div>
  );
}

export default function OrderTrackByNumberPage({
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
