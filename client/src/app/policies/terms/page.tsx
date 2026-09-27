import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-2xl font-bold">Terms of Service</h1>
      <p className="mt-4 text-sm text-muted">
        Placeholder — replace with counsel-approved terms before production.
      </p>
    </main>
  );
}
