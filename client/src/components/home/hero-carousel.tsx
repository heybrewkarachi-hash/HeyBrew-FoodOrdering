"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@/components/ui/icons";
import { CheckerboardAccent } from "@/components/decorations/brand-art";
import { usePublicSettings } from "@/hooks/use-settings";
import {
  DEMO_HERO_IMAGE,
  DEMO_HERO_IMAGE_MOBILE,
} from "@/lib/demo-catalog";
import { cn } from "@/lib/cn";

/**
 * Hero frame sizes (mockup):
 * - Desktop display: 1440 × 320 (aspect 9∶2); serve 2880 × 640 for retina
 * - Mobile: separate 900 × 450 crop (aspect 2∶1) so text/cups are not cropped
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
        title: "Your daily brew, delivered.",
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

  const scrollToMenu = () => {
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative mx-auto w-full max-w-[1440px] px-4 pt-3 md:px-6 md:pt-3">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-surface shadow-soft md:rounded-[2rem]">
        {/* Mobile 900×450 (2∶1) · Desktop 1440×320 (9∶2) */}
        <div className="relative aspect-[2/1] w-full md:aspect-[9/2]">
          {/* Mobile crop */}
          <Image
            src={mobileSrc}
            alt="Temporary placeholder image — café drinks (mobile 900×450)"
            fill
            className="object-cover object-center md:hidden"
            priority
            sizes="100vw"
          />
          {/* Desktop / retina — prefer 2880×640 source */}
          <Image
            src={desktopSrc}
            alt="Temporary placeholder image — café drinks (desktop 2880×640 → 1440×320)"
            fill
            className="hidden object-cover object-center md:block"
            priority
            sizes="(max-width: 1440px) 100vw, 1440px"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/80 to-transparent md:via-cream/70" />
          <CheckerboardAccent className="absolute right-3 top-3 h-8 w-8 opacity-80 md:right-5 md:top-4 md:h-10 md:w-10" />
          <CheckerboardAccent className="absolute bottom-3 left-3 hidden h-8 w-8 opacity-70 md:block" />

          <div className="absolute inset-0 flex flex-col justify-center px-5 py-4 md:px-10 md:py-6">
            <h1 className="max-w-[12rem] font-display text-2xl font-extrabold leading-[1.1] text-espresso sm:max-w-xs sm:text-3xl md:max-w-sm md:text-4xl lg:text-[2.75rem] animate-slide-up">
              {current.title || "Your daily brew, delivered."}
            </h1>
            <Button
              size="md"
              className="mt-3 w-fit bg-espresso px-5 py-2.5 text-cream md:mt-4"
              onClick={scrollToMenu}
            >
              Order Now
              <IconArrowRight />
            </Button>
          </div>
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
