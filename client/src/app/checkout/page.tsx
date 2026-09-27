import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8 md:px-6">
      <h1 className="mb-6 font-display text-3xl font-extrabold text-espresso">
        Checkout
      </h1>
      <CheckoutForm />
    </div>
  );
}
