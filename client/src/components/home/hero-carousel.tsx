"use client";

import Image from "next/image";
import { CheckerboardAccent } from "@/components/decorations/brand-art";
import { usePublicSettings } from "@/hooks/use-settings";
import {
  DEMO_HERO_IMAGE,
  DEMO_HERO_IMAGE_MOBILE,
} from "@/lib/demo-catalog";

/**
 * Static hero image (no carousel).
 * - Desktop: 1440 × 320 (aspect 9∶2)
 * - Mobile: 900 × 450 (aspect 2∶1)
 */
export function HeroCarousel() {
  const { data: settings } = usePublicSettings();
  const banner = settings?.banners?.find((b) => b.isActive);

  const desktopSrc = banner?.imageUrl || DEMO_HERO_IMAGE;
  const mobileSrc =
    banner?.imageUrlMobile || banner?.imageUrl || DEMO_HERO_IMAGE_MOBILE;

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
      </div>
    </section>
  );
}
