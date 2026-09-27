import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact HeyBrew — details configured in admin.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl font-extrabold">Contact</h1>
      <p className="mt-4 text-muted">
        Phone, WhatsApp, email, and hours are managed in Store Settings.
        Replace this placeholder once configured in admin.
      </p>
    </div>
  );
}
