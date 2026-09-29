/**
 * DEVELOPMENT FALLBACK catalog.
 * Used only when the API is unreachable so UI work can continue.
 * Prices match mockup demo values and must be replaced via admin/seed.
 */

import type {
  Branch,
  Category,
  DeliveryZone,
  MenuResponse,
  Product,
  PublicSettingsClient,
} from "./types";

const TEMP = {
  /** Desktop hero source 2880×640 (9∶2) — Temporary placeholder image */
  heroDesktop:
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=2880&h=640&fit=crop&q=80",
  /** Mobile hero 900×450 (2∶1) — separate crop so cups/text are not cut off */
  heroMobile:
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&h=450&fit=crop&q=80",
  hero: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=2880&h=640&fit=crop&q=80",
  cappuccino:
    "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&q=80",
  latte:
    "https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=800&q=80",
  matcha:
    "https://images.unsplash.com/photo-1515823662972-da45a9c2b4e0?w=800&q=80",
  marshmallow:
    "https://images.unsplash.com/photo-1578374173705-969cbe6f2d6b?w=800&q=80",
  spanish:
    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80",
  brownie:
    "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80",
  cookie:
    "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&q=80",
  cold:
    "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&q=80",
};

export const DEMO_BRANCHES: Branch[] = [
  {
    id: "demo-branch-bahadurabad",
    name: "HeyBrew Bahadurabad",
    addressLabel:
      "293 Bahadurabad Rd No. 15, Bahadurabad Bahadur Yar Jang CHS, Karachi, 07482, Pakistan",
    mapsUrl: "https://maps.app.goo.gl/Ti3HrY1thNrRXa3G9",
    isActive: true,
    hoursNote: "Configure in admin — hours not set",
  },
];

export const DEMO_ZONES: DeliveryZone[] = [
  {
    id: "demo-zone-bahadurabad",
    name: "Bahadurabad / PECHS",
    branchId: "demo-branch-bahadurabad",
    feeMinor: 15000,
    isActive: true,
    etaNote: "Configure in admin — ETA not a real promise",
  },
  {
    id: "demo-zone-gulshan",
    name: "Gulshan / Defence",
    branchId: "demo-branch-bahadurabad",
    feeMinor: 20000,
    isActive: true,
    etaNote: "Configure in admin — ETA not a real promise",
  },
];

export const DEMO_CATEGORIES: Category[] = [
  { id: "cat-popular", name: "Popular", slug: "popular", sortOrder: 0 },
  { id: "cat-hot-brew", name: "Hot Brew", slug: "hot-brew", sortOrder: 1 },
  { id: "cat-cold-brew", name: "Cold Brew", slug: "cold-brew", sortOrder: 2 },
  { id: "cat-frappe", name: "Frappe", slug: "frappe", sortOrder: 3 },
  { id: "cat-matcha", name: "Matcha", slug: "matcha", sortOrder: 4 },
  { id: "cat-speciality", name: "Speciality", slug: "speciality", sortOrder: 5 },
  { id: "cat-mojitos", name: "Mojitos", slug: "mojitos", sortOrder: 6 },
  { id: "cat-shake", name: "Shake", slug: "shake", sortOrder: 7 },
  { id: "cat-juice", name: "Juice", slug: "juice", sortOrder: 8 },
  { id: "cat-dessert", name: "Dessert", slug: "dessert", sortOrder: 9 },
];

/** Popular from each category — standard price Rs 150 */
export const DEMO_PRODUCTS: Product[] = [
  {
    id: "prod-spanish-latte",
    name: "Spanish Latte",
    slug: "spanish-latte",
    description: "Hot Brew favourite.",
    categoryId: "cat-hot-brew",
    imageUrl: TEMP.spanish,
    basePriceMinor: 15000,
    isPopular: true,
    isAvailable: true,
    variants: [],
    modifierGroups: [],
    tags: ["hot", "popular"],
  },
  {
    id: "prod-mocha-latte",
    name: "Mocha Latte",
    slug: "mocha-latte",
    description: "Cold Brew favourite.",
    categoryId: "cat-cold-brew",
    imageUrl: TEMP.marshmallow,
    basePriceMinor: 15000,
    isPopular: true,
    isAvailable: true,
    variants: [],
    modifierGroups: [],
    tags: ["cold", "popular"],
  },
  {
    id: "prod-pistachio-frappe",
    name: "Pistachio Frappe",
    slug: "pistachio-frappe",
    description: "Frappe favourite.",
    categoryId: "cat-frappe",
    imageUrl: TEMP.latte,
    basePriceMinor: 15000,
    isPopular: true,
    isAvailable: true,
    variants: [],
    modifierGroups: [],
    tags: ["frappe", "popular"],
  },
  {
    id: "prod-strawberry-matcha",
    name: "Strawberry Matcha",
    slug: "strawberry-matcha",
    description: "Matcha favourite.",
    categoryId: "cat-matcha",
    imageUrl: TEMP.matcha,
    basePriceMinor: 15000,
    isPopular: true,
    isAvailable: true,
    variants: [],
    modifierGroups: [],
    tags: ["matcha", "popular"],
  },
  {
    id: "prod-bull-hit",
    name: "Bull Hit",
    slug: "bull-hit",
    description: "Mojitos favourite.",
    categoryId: "cat-mojitos",
    imageUrl: TEMP.cold,
    basePriceMinor: 15000,
    isPopular: true,
    isAvailable: true,
    variants: [],
    modifierGroups: [],
    tags: ["mojitos", "popular"],
  },
  {
    id: "prod-protein-shake",
    name: "Protein Shake",
    slug: "protein-shake",
    description: "Shake favourite.",
    categoryId: "cat-shake",
    imageUrl: TEMP.marshmallow,
    basePriceMinor: 15000,
    isPopular: true,
    isAvailable: true,
    variants: [],
    modifierGroups: [],
    tags: ["shake", "popular"],
  },
  {
    id: "prod-liver-purifier",
    name: "Liver Purifier",
    slug: "liver-purifier",
    description: "Juice favourite.",
    categoryId: "cat-juice",
    imageUrl: TEMP.cold,
    basePriceMinor: 15000,
    isPopular: true,
    isAvailable: true,
    variants: [],
    modifierGroups: [],
    tags: ["juice", "popular"],
  },
];

export const DEMO_MENU: MenuResponse = {
  categories: DEMO_CATEGORIES,
  products: DEMO_PRODUCTS,
  popularProductIds: DEMO_PRODUCTS.map((p) => p.id),
  source: "demo",
};

export const DEMO_SETTINGS: PublicSettingsClient = {
  storeName: "HeyBrew",
  tagline: "Your daily brew, delivered.",
  contactPhone: null,
  contactEmail: null,
  whatsappNumber: null,
  taxEnabled: false,
  taxRateBps: 0,
  banners: [
    {
      id: "banner-1",
      imageUrl: TEMP.heroDesktop,
      imageUrlMobile: TEMP.heroMobile,
      title: "Your daily brew, delivered.",
      subtitle: "Development seed hero — replace in admin (2880×640 / 900×450)",
      linkUrl: "#menu",
      isActive: true,
    },
    {
      id: "banner-2",
      imageUrl:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=2880&h=640&fit=crop&q=80",
      imageUrlMobile:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=900&h=450&fit=crop&q=80",
      title: "Slow mornings. Fast delivery.",
      subtitle: "Development seed — Configure in admin",
      linkUrl: "#menu",
      isActive: true,
    },
  ],
  announcements: [
    {
      id: "ann-1",
      message: "DEVELOPMENT FALLBACK — API offline. Showing seed catalog.",
      isActive: true,
    },
  ],
  social: {
    instagram: null,
    facebook: null,
    tiktok: null,
  },
  paymentMethods: {
    cod: true,
    card_placeholder: false,
    wallet_placeholder: false,
  },
  currency: "PKR",
  source: "demo",
};

export const DEMO_HERO_IMAGE = TEMP.heroDesktop;
export const DEMO_HERO_IMAGE_MOBILE = TEMP.heroMobile;

export function unitPriceForSelection(
  product: Product,
  variantId?: string | null,
  modifiers: Array<{ priceDeltaMinor: number }> = []
): number {
  const variant =
    product.variants.find((v) => v.id === variantId) ??
    product.variants.find((v) => v.isDefault) ??
    product.variants[0];
  const base = variant?.priceMinor ?? product.basePriceMinor;
  const extras = modifiers.reduce((s, m) => s + (m.priceDeltaMinor || 0), 0);
  return base + extras;
}
