"use client";

import { useEffect } from "react";

/**
 * Mobile browsers often restore a mid-page scroll or jump to `#menu` on load.
 * Force the home storefront to start at the top unless the user clicked an in-page hash.
 */
export function HomeScrollReset() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.history.scrollRestoration = "manual";
    } catch {
      /* ignore */
    }

    const hash = window.location.hash;
    // Accidental / stale #menu on cold open scrolls past the hero — clear it
    if (hash === "#menu" || hash === "#") {
      const path = `${window.location.pathname}${window.location.search}`;
      window.history.replaceState(null, "", path);
    }

    const toTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    toTop();
    const raf = window.requestAnimationFrame(toTop);
    const t1 = window.setTimeout(toTop, 50);
    const t2 = window.setTimeout(toTop, 300);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  return null;
}
