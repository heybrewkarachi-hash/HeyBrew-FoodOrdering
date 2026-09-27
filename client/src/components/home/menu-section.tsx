"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CategorySearchBar } from "./category-search-bar";
import { ProductCard } from "./product-card";
import { PromoStrip } from "./promo-strip";
import { CheckerboardAccent } from "@/components/decorations/brand-art";
import { useMenu } from "@/hooks/use-menu";
import type { Category, Product } from "@/lib/types";

type MenuBlock = {
  category: Category;
  products: Product[];
};

const STICKY_BAR_OFFSET = 56;

export function MenuSection() {
  const { data: menu, isLoading, isError } = useMenu();
  const [activeSlug, setActiveSlug] = useState("popular");
  const [query, setQuery] = useState("");
  const scrollingToRef = useRef<string | null>(null);
  const spyPausedUntil = useRef(0);

  const categories = useMemo(() => {
    const list = [...(menu?.categories ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder
    );
    if (list.length) return list;
    return [
      { id: "popular", name: "Popular", slug: "popular", sortOrder: 0 },
    ] satisfies Category[];
  }, [menu?.categories]);

  const products = useMemo(() => menu?.products ?? [], [menu?.products]);
  const popularIds = useMemo(
    () => new Set(menu?.popularProductIds ?? []),
    [menu?.popularProductIds]
  );

  const q = query.trim().toLowerCase();

  const matchesQuery = useCallback(
    (p: Product) => {
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    },
    [q]
  );

  const blocks: MenuBlock[] = useMemo(() => {
    const available = products.filter((p) => p.isAvailable !== false);

    return categories
      .map((category) => {
        let list: Product[];
        if (category.slug === "popular") {
          list = available.filter(
            (p) =>
              p.isPopular ||
              popularIds.has(p.id) ||
              p.categoryId === category.id
          );
        } else {
          list = available.filter((p) => p.categoryId === category.id);
        }
        list = list.filter(matchesQuery);
        return { category, products: list };
      })
      .filter((b) => b.products.length > 0);
  }, [categories, products, popularIds, matchesQuery]);

  useEffect(() => {
    if (!blocks.length) return;
    if (!blocks.some((b) => b.category.slug === activeSlug)) {
      setActiveSlug(blocks[0].category.slug);
    }
  }, [blocks, activeSlug]);

  // Scroll-spy via scroll position — highlight only, never scrolls the page
  useEffect(() => {
    if (q || !blocks.length) return;

    const updateActive = () => {
      if (Date.now() < spyPausedUntil.current) return;
      if (scrollingToRef.current) return;

      let current = blocks[0].category.slug;
      for (const block of blocks) {
        const el = document.getElementById(`category-${block.category.slug}`);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        // Section has crossed under the sticky bar
        if (top - STICKY_BAR_OFFSET <= 12) {
          current = block.category.slug;
        }
      }
      setActiveSlug((prev) => (prev === current ? prev : current));
    };

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);
    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [blocks, q]);

  const scrollToCategory = (slug: string) => {
    const el = document.getElementById(`category-${slug}`);
    setActiveSlug(slug);
    if (!el) return;

    scrollingToRef.current = slug;
    spyPausedUntil.current = Date.now() + 900;

    const top =
      window.scrollY + el.getBoundingClientRect().top - STICKY_BAR_OFFSET - 8;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });

    window.setTimeout(() => {
      scrollingToRef.current = null;
    }, 950);
  };

  return (
    <section id="menu" className="pb-28 md:pb-10">
      <CategorySearchBar
        categories={q ? blocks.map((b) => b.category) : categories}
        activeSlug={activeSlug}
        onCategoryChange={scrollToCategory}
        query={query}
        onQueryChange={setQuery}
      />

      <PromoStrip />

      {menu?.source === "demo" && (
        <p className="mx-auto mt-2 max-w-6xl px-4 text-center text-[10px] font-semibold text-amber-800/70 md:px-6">
          DEVELOPMENT FALLBACK catalog
        </p>
      )}

      {isLoading && (
        <p className="mt-6 text-center text-muted">Loading menu…</p>
      )}
      {isError && !menu && (
        <p className="mt-6 text-center text-muted">
          Could not load menu. Showing fallback when available.
        </p>
      )}

      <div className="mx-auto mt-2 flex max-w-6xl flex-col gap-6 px-3 sm:px-4 md:mt-4 md:gap-8 md:px-6">
        {blocks.map(({ category, products: sectionProducts }) => (
          <div
            key={category.id}
            id={`category-${category.slug}`}
            className="scroll-mt-16"
          >
            <div className="mb-3 flex items-center justify-center gap-2 md:mb-4">
              <CheckerboardAccent className="h-4 w-4 md:h-5 md:w-5" />
              <h2 className="font-display text-lg font-extrabold text-espresso md:text-xl">
                {category.slug === "popular" ? "Popular Brews" : category.name}
              </h2>
              <CheckerboardAccent className="h-4 w-4 md:h-5 md:w-5" />
            </div>

            {/* 2-col compact cards → ~4 visible like Sugar Latte */}
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:gap-3 lg:grid-cols-3 lg:gap-4">
              {sectionProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {!isLoading && blocks.length === 0 && (
        <p className="mt-8 text-center text-muted">
          No brews match your search. Try another keyword.
        </p>
      )}
    </section>
  );
}
