"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CheckerboardAccent } from "@/components/decorations/brand-art";
import { usePublicSettings } from "@/hooks/use-settings";
import {
  DEMO_HERO_IMAGE,
  DEMO_HERO_IMAGE_MOBILE,
} from "@/lib/demo-catalog";
import { cn } from "@/lib/cn";

/**
 * Hero image only (no headline / CTA overlay).
 * - Desktop: 1440 × 320 (aspect 9∶2)
 * - Mobile: 900 × 450 (aspect 2∶1)
 */
export function HeroCarousel() {
  const { data: settings } = usePublicSettings();
  const banners =
    settings?.banners?.filter((b) => b.isActive) ??
    [
      {
        id: "fallback",
        imageUrl: DEMO_HERO_IMAGE,
        imageUrlMobile: DEMO_HERO_IMAGE_MOBILE,
        title: null,
        subtitle: null,
        linkUrl: "#menu",
        isActive: true,
      },
    ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 6000);
    return () => clearInterval(id);
  }, [banners.length]);

  const current = banners[index] ?? banners[0];
  const desktopSrc = current.imageUrl || DEMO_HERO_IMAGE;
  const mobileSrc =
    current.imageUrlMobile || current.imageUrl || DEMO_HERO_IMAGE_MOBILE;

  return (
    <section className="relative mx-auto w-full max-w-[1440px] px-4 pt-3 md:px-6 md:pt-3">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-surface shadow-soft md:rounded-[2rem]">
        <div className="relative aspect-[2/1] w-full md:aspect-[9/2]">
          <Image
            src={mobileSrc}
            alt="HeyBrew café"
            fill
            className="object-cover object-center md:hidden"
            priority
            sizes="100vw"
          />
          <Image
            src={desktopSrc}
            alt="HeyBrew café"
            fill
            className="hidden object-cover object-center md:block"
            priority
            sizes="(max-width: 1440px) 100vw, 1440px"
          />

          <CheckerboardAccent className="absolute right-3 top-3 h-8 w-8 opacity-80 md:right-5 md:top-4 md:h-10 md:w-10" />
          <CheckerboardAccent className="absolute bottom-3 left-3 hidden h-8 w-8 opacity-70 md:block" />
        </div>

        {banners.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-2 md:bottom-3">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Show slide ${i + 1}`}
                className={cn(
                  "h-2 w-2 rounded-full transition md:h-2.5 md:w-2.5",
                  i === index ? "w-5 bg-espresso md:w-6" : "bg-cream/90"
                )}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
