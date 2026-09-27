import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12 text-center md:px-6">
      <h1 className="font-display text-3xl font-extrabold text-espresso">
        Your Cart
      </h1>
      <p className="mt-3 text-muted">
        Use the cart button in the header to review items, or continue to
        checkout.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/#menu"
          className="inline-flex min-h-touch items-center justify-center rounded-pill bg-surface px-6 py-3 font-display font-bold text-espresso"
        >
          Continue shopping
        </Link>
        <Link
          href="/checkout"
          className="inline-flex min-h-touch items-center justify-center rounded-pill bg-espresso px-6 py-3 font-display font-bold text-cream"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
