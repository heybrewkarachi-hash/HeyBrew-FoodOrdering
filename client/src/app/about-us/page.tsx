import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
  description: "HeyBrew — brand story (content configurable).",
};

export default function AboutUsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl font-extrabold">About Us</h1>
      <p className="mt-4 text-muted">
        Brand story content should be configured by HeyBrew. This page is a
        placeholder for production copy — do not invent café history or claims.
      </p>
      <Link href="/" className="mt-8 inline-block font-semibold underline">
        Back to menu
      </Link>
    </div>
  );
}
