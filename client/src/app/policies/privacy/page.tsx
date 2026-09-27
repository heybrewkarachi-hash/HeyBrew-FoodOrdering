import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-2xl font-bold">Privacy Policy</h1>
      <p className="mt-4 text-sm text-muted">
        Placeholder — replace with counsel-approved privacy policy before
        production.
      </p>
    </main>
  );
}
