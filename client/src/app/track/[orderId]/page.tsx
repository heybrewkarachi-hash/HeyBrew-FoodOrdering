import type { Metadata } from "next";
import { OrderTracker } from "@/components/track/order-tracker";

export const metadata: Metadata = {
  title: "Track order",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function TrackPage({ params, searchParams }: Props) {
  const { orderId } = await params;
  const { token = "" } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-4 py-8 md:px-6">
      <OrderTracker orderId={orderId} token={token} />
    </div>
  );
}
