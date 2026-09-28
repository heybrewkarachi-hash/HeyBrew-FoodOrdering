"use client";

import Image from "next/image";
import { CheckerboardAccent } from "@/components/decorations/brand-art";
import { usePublicSettings } from "@/hooks/use-settings";

/** Old Unsplash seed hero — never show this on the live storefront. */
const DEMO_HERO_MARKERS = [
  "photo-1495474472287-4d71bcdd2085",
  "photo-1509042239860-f550ce710b93",
];

function isUsableHeroUrl(url?: string | null): url is string {
  const trimmed = url?.trim();
  if (!trimmed) return false;
  return !DEMO_HERO_MARKERS.some((m) => trimmed.includes(m));
}

/**
 * Static hero image (no carousel).
 * - Desktop: 1440 x 320 (aspect 9:2)
 * - Mobile: 900 x 450 (aspect 2:1)
 *
 * Do not fall back to demo/Unsplash while settings load — that caused a
 * 1-2s flash of the old placeholder before the real banner arrived.
 */
export function HeroCarousel() {
  const { data: settings, isPending, isError } = usePublicSettings();
  const banner = settings?.banners?.find((b) => b.isActive);

  const desktopSrc = isUsableHeroUrl(banner?.imageUrl)
    ? banner!.imageUrl!.trim()
    : "";
  const mobileCandidate =
    banner?.imageUrlMobile?.trim() || banner?.imageUrl?.trim() || "";
  const mobileSrc = isUsableHeroUrl(mobileCandidate)
    ? mobileCandidate
    : desktopSrc;

  const showImage = Boolean(desktopSrc || mobileSrc);
  const showSkeleton = isPending && !showImage;

  if (!showSkeleton && !showImage && (isError || settings)) {
    return null;
  }

  return (
    <section className="relative mx-auto w-full max-w-[1440px] px-4 pt-3 md:px-6 md:pt-3">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-surface shadow-soft md:rounded-[2rem]">
        <div className="relative aspect-[2/1] w-full md:aspect-[9/2]">
          {showSkeleton && (
            <div
              className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#f3ebe3] via-[#ebe0d4] to-[#e2d4c4]"
              aria-hidden
            />
          )}

          {showImage && (
            <>
              <Image
                src={mobileSrc || desktopSrc}
                alt={banner?.title || "HeyBrew"}
                fill
                className="object-cover object-center md:hidden"
                priority
                sizes="100vw"
              />
              <Image
                src={desktopSrc || mobileSrc}
                alt={banner?.title || "HeyBrew"}
                fill
                className="hidden object-cover object-center md:block"
                priority
                sizes="(max-width: 1440px) 100vw, 1440px"
              />
            </>
          )}

          <CheckerboardAccent className="absolute right-3 top-3 h-8 w-8 opacity-80 md:right-5 md:top-4 md:h-10 md:w-10" />
          <CheckerboardAccent className="absolute bottom-3 left-3 hidden h-8 w-8 opacity-70 md:block" />
        </div>
      </div>
    </section>
  );
}