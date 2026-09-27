"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { IconArrowRight, IconSearch } from "@/components/ui/icons";
import type { Category } from "@/lib/types";

type Props = {
  categories: Category[];
  activeSlug: string;
  onCategoryChange: (slug: string) => void;
  query: string;
  onQueryChange: (q: string) => void;
};

export function CategorySearchBar({
  categories,
  activeSlug,
  onCategoryChange,
  query,
  onQueryChange,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Horizontally center active tab inside the strip only — never scroll the page
  useEffect(() => {
    const list = listRef.current;
    const tab = tabRefs.current[activeSlug];
    if (!list || !tab) return;
    const left = tab.offsetLeft - list.clientWidth / 2 + tab.offsetWidth / 2;
    list.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [activeSlug]);

  return (
    <>
      {/* Search — scrolls away with the page */}
      <div className="mx-auto max-w-6xl px-4 pb-3 pt-4 md:px-6">
        <form
          className="mx-auto flex w-full max-w-xl items-center gap-2 rounded-pill bg-surface py-1 pl-4 pr-1 md:max-w-2xl"
          onSubmit={(e) => e.preventDefault()}
          role="search"
        >
          <IconSearch className="shrink-0 text-muted" aria-hidden />
          <label className="sr-only" htmlFor="brew-search">
            Search your favourite brew
          </label>
          <input
            id="brew-search"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search your favourite brew"
            className="min-h-10 w-full bg-transparent text-sm text-espresso placeholder:text-muted focus:outline-none md:min-h-[2.5rem]"
          />
          <button
            type="submit"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-espresso text-cream md:h-10 md:w-10"
            aria-label="Search"
          >
            <IconArrowRight />
          </button>
        </form>
      </div>

      {/* Sticky category strip — pinned to viewport top while scrolling menu */}
      <div className="sticky top-0 z-50 w-full border-b border-espresso/10 bg-[#F7F4F0] shadow-[0_1px_0_rgba(60,30,24,0.06)]">
        <div
          ref={listRef}
          className="flex w-full items-center justify-start gap-1 overflow-x-auto no-scrollbar px-3 py-2.5 sm:gap-1.5 sm:px-4 md:justify-center md:px-6 md:py-3"
          role="tablist"
          aria-label="Drink categories"
        >
          {categories.map((cat) => {
            const active = cat.slug === activeSlug;
            return (
              <button
                key={cat.id}
                ref={(node) => {
                  tabRefs.current[cat.slug] = node;
                }}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`category-${cat.slug}`}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 font-display text-[18px] font-extrabold tracking-tight transition sm:px-4",
                  active
                    ? "bg-espresso text-cream shadow-sm"
                    : "bg-transparent text-espresso hover:text-espresso"
                )}
                onClick={() => onCategoryChange(cat.slug)}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
