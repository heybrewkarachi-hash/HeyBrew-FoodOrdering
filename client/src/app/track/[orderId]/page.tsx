import type { Metadata } from "next";
import { OrderTracker } from "@/components/track/order-tracker";

export const metadata: Metadata = {
  title: "Track order",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ token?: string; n?: string }>;
};

export default async function TrackPage({ params, searchParams }: Props) {
  const { orderId } = await params;
  const { token = "", n = "" } = await searchParams;
  const decodedId = decodeURIComponent(orderId);
  // Prefer explicit order number query; fall back to path segment if it looks like HB-…
  const orderNumber =
    n ||
    (decodedId.startsWith("HB-") || decodedId.startsWith("HB")
      ? decodedId
      : "");

  return (
    <div className="mx-auto max-w-lg px-4 py-8 md:px-6">
      {!token || !orderNumber ? (
        <div className="rounded-card bg-surface p-6 text-center">
          <p className="font-display text-lg font-bold text-espresso">
            Missing tracking details
          </p>
          <p className="mt-2 text-sm text-muted">
            Open your order from the Orders page, or use the full link from
            checkout (includes token).
          </p>
        </div>
      ) : (
        <OrderTracker
          orderId={decodedId}
          orderNumber={decodeURIComponent(orderNumber)}
          token={token}
        />
      )}
    </div>
  );
}
