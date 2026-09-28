import { HeroCarousel } from "@/components/home/hero-carousel";
import { HomeScrollReset } from "@/components/home/home-scroll-reset";
import { MenuSection } from "@/components/home/menu-section";

export default function HomePage() {
  return (
    <>
      <HomeScrollReset />
      <HeroCarousel />
      <MenuSection />
    </>
  );
}
