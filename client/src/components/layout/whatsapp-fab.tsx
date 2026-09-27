"use client";

import { IconWhatsApp } from "@/components/ui/icons";
import { usePublicSettings } from "@/hooks/use-settings";

export function WhatsAppFab() {
  const { data: settings } = usePublicSettings();
  const number = settings?.whatsappNumber?.replace(/\D/g, "");

  if (!number) {
    return (
      <button
        type="button"
        className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-soft safe-pb"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        aria-label="WhatsApp — Configure in admin"
        title="WhatsApp number: Configure in admin"
        onClick={() =>
          alert(
            "WhatsApp number is not configured yet. Configure in admin."
          )
        }
      >
        <IconWhatsApp className="h-7 w-7" />
      </button>
    );
  }

  return (
    <a
      href={`https://wa.me/${number}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-soft"
      style={{ marginBottom: "max(0px, env(safe-area-inset-bottom))" }}
      aria-label="Chat on WhatsApp"
    >
      <IconWhatsApp className="h-7 w-7" />
    </a>
  );
}
