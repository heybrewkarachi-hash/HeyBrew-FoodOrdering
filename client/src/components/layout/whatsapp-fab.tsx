"use client";

import { IconWhatsApp } from "@/components/ui/icons";
import { useCart } from "@/context/cart-context";
import { usePublicSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/cn";

export function WhatsAppFab() {
  const { data: settings } = usePublicSettings();
  const { itemCount, drawerOpen } = useCart();
  const number = settings?.whatsappNumber?.replace(/\D/g, "");

  // Sit above the mobile sticky cart bar when it is visible
  const aboveCartBar = itemCount > 0 && !drawerOpen;

  const positionClass = cn(
    "fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-soft md:right-5 md:bottom-5",
    aboveCartBar
      ? "bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]"
      : "bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))]"
  );

  if (!number) {
    return (
      <button
        type="button"
        className={positionClass}
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
      className={positionClass}
      aria-label="Chat on WhatsApp"
    >
      <IconWhatsApp className="h-7 w-7" />
    </a>
  );
}
