import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  robots: { index: false, follow: false },
};

export default function RefundPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:px-6">
      <h1 className="font-display text-3xl font-extrabold text-espresso">
        Refund Policy
      </h1>
      <div className="mt-6 space-y-4 rounded-card bg-surface p-6">
        <p>
          Placeholder refund and cancellation policy. Real rules will be
          configured in admin and reviewed legally.
        </p>
        <p className="text-sm text-muted">Configure in admin / legal counsel.</p>
      </div>
    </div>
  );
}
