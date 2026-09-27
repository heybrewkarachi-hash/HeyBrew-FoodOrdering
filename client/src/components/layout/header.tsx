"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useCart } from "@/context/cart-context";
import { orderTypeLabel, useOrdering } from "@/context/ordering-context";
import { useUi } from "@/context/ui-context";
import { usePublicSettings } from "@/hooks/use-settings";
import {
  IconCart,
  IconMapPin,
  IconMenu,
  IconPhone,
  IconX,
} from "@/components/ui/icons";

const NAV = [
  { href: "/#menu", label: "Menu" },
  { href: "/about-us", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const { openSetup, session, locationLabel } = useOrdering();
  const { itemCount, setDrawerOpen } = useCart();
  const { mobileMenuOpen, setMobileMenuOpen } = useUi();
  const { data: settings } = usePublicSettings();
  const [mounted, setMounted] = useState(false);

  const phone = settings?.contactPhone;
  const locationText =
    locationLabel ||
    (session.completed
      ? `${orderTypeLabel(session.type)}`
      : "Select location");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  return (
    <header className="relative z-40 border-b border-espresso/5 bg-cream safe-pt">
      <div className="mx-auto grid h-[var(--header-height)] max-w-6xl grid-cols-[1fr_auto] items-center gap-3 px-4 md:grid-cols-[1fr_auto_1fr] md:px-6">
        <Link
          href="/"
          className="flex min-h-touch items-center gap-0.5 justify-self-start rounded-xl transition-opacity duration-200 hover:opacity-90 active:opacity-80 focus-visible:outline-none"
        >
          <Image
            src="/brand/heybrew-logo-mark.png"
            alt="HeyBrew"
            width={64}
            height={64}
            className="h-11 w-11 object-contain md:h-14 md:w-14"
            priority
          />
          <span className="relative top-0.5 font-display text-lg font-extrabold tracking-tight text-black md:top-1 md:text-xl">
            HeyBrew<span className="text-black">.</span>
          </span>
        </Link>

        <nav
          className="hidden items-center justify-center gap-8 md:flex"
          aria-label="Primary"
        >
          {NAV.map((item) => {
            const active =
              item.href === "/#menu"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative py-2 font-display text-base font-bold text-espresso/70 transition-colors duration-200 ease-out hover:text-espresso active:text-espresso",
                  active && "text-espresso"
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "absolute inset-x-0 -bottom-0.5 h-1 rounded-full bg-espresso transition-transform duration-200 ease-out origin-center",
                    active ? "scale-x-100" : "scale-x-0"
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-end gap-2 justify-self-end">
          <button
            type="button"
            onClick={openSetup}
            className="hidden min-h-touch items-center gap-2 rounded-pill bg-surface px-4 py-2 text-sm font-semibold text-espresso transition-transform duration-150 ease-out hover:bg-surface/80 active:scale-95 md:inline-flex"
            aria-label="Change location or order type"
          >
            <IconMapPin className="h-4 w-4" />
            <span className="max-w-[10rem] truncate">{locationText}</span>
          </button>

          {phone ? (
            <a
              href={`tel:${phone}`}
              className="hidden h-11 w-11 items-center justify-center rounded-full bg-surface text-espresso transition-transform duration-150 ease-out hover:bg-surface/80 active:scale-95 md:inline-flex"
              aria-label="Call HeyBrew"
            >
              <IconPhone />
            </a>
          ) : (
            <button
              type="button"
              className="hidden h-11 w-11 items-center justify-center rounded-full bg-surface text-espresso transition-transform duration-150 ease-out hover:bg-surface/80 active:scale-95 md:inline-flex"
              aria-label="Phone number — Configure in admin"
              title="Configure in admin"
              onClick={() =>
                alert("Phone number not configured. Configure in admin.")
              }
            >
              <IconPhone />
            </button>
          )}

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface text-espresso transition-transform duration-150 ease-out hover:bg-surface/80 active:scale-95"
            aria-label={`Cart, ${itemCount} items`}
          >
            <IconCart />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-espresso px-1 text-[10px] font-bold text-cream">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={openSetup}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface text-espresso transition-transform duration-150 ease-out hover:bg-surface/80 active:scale-95 md:hidden"
            aria-label="Select location"
          >
            <IconMapPin />
          </button>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface text-espresso transition-transform duration-150 ease-out hover:bg-surface/80 active:scale-95 md:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <IconX /> : <IconMenu />}
          </button>
        </div>
      </div>

      {mounted &&
        mobileMenuOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] md:hidden" role="presentation">
            <button
              type="button"
              className="absolute inset-0 bg-espresso/40 backdrop-blur-[2px] animate-fade-in"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside
              className="absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] flex-col bg-cream shadow-soft animate-slide-in-left safe-pt"
              style={{ paddingLeft: "env(safe-area-inset-left)" }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <div className="flex items-center justify-between border-b border-espresso/10 bg-cream px-4 py-3">
                <div className="flex items-center gap-0.5">
                  <Image
                    src="/brand/heybrew-logo-mark.png"
                    alt=""
                    width={40}
                    height={40}
                    className="h-9 w-9 object-contain"
                  />
                  <span className="font-display text-base font-extrabold text-espresso">
                    Menu
                  </span>
                </div>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface text-espresso"
                  aria-label="Close menu"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <IconX />
                </button>
              </div>
              <nav
                className="flex flex-1 flex-col gap-1 overflow-y-auto bg-cream px-3 py-4"
                aria-label="Mobile"
              >
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="min-h-touch rounded-2xl px-4 py-3 font-display text-lg font-bold text-espresso transition-colors duration-150 hover:bg-surface active:bg-surface/80"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <button
                  type="button"
                  className="min-h-touch rounded-2xl px-4 py-3 text-left font-display text-lg font-bold text-espresso transition-colors duration-150 hover:bg-surface active:bg-surface/80"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openSetup();
                  }}
                >
                  Change location
                </button>
              </nav>
            </aside>
          </div>,
          document.body
        )}
    </header>
  );
}
