/**
 * Featured / Popular items only — used when API is offline.
 * Matches admin Popular list from official menu.
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
  heroDesktop:
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=2880&h=640&fit=crop&q=80",
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
  { id: "cat-specialty", name: "Specialty", slug: "specialty", sortOrder: 2 },
  { id: "cat-cold-brew", name: "Cold Brew", slug: "cold-brew", sortOrder: 3 },
  { id: "cat-matcha", name: "Matcha", slug: "matcha", sortOrder: 4 },
  { id: "cat-frappe", name: "Frappe", slug: "frappe", sortOrder: 5 },
  {
    id: "cat-mojitos-refreshers",
    name: "Mojitos / Refreshers",
    slug: "mojitos-refreshers",
    sortOrder: 6,
  },
  { id: "cat-shakes", name: "Shakes", slug: "shakes", sortOrder: 7 },
  { id: "cat-juice", name: "Juice", slug: "juice", sortOrder: 8 },
  { id: "cat-beverages", name: "Beverages", slug: "beverages", sortOrder: 9 },
  { id: "cat-add-ons", name: "Add Ons", slug: "add-ons", sortOrder: 10 },
  { id: "cat-the-bites", name: "The Bites", slug: "the-bites", sortOrder: 11 },
];

/** Popular section — one pick per category as specified by HeyBrew */
export const DEMO_PRODUCTS: Product[] = [
  {
    id: "prod-spanish-latte",
    name: "Spanish Latte",
    slug: "spanish-latte",
    description: "Sweet, creamy and smooth coffee with a rich milky finish.",
    categoryId: "cat-hot-brew",
    imageUrl: TEMP.spanish,
    basePriceMinor: 70000,
    isPopular: true,
    isAvailable: true,
    variants: [],
    modifierGroups: [],
    tags: ["hot", "spanish", "popular"],
  },
  {
    id: "prod-cold-mocha-latte",
    name: "Mocha Latte",
    slug: "cold-mocha-latte",
    description: "Rich chocolate and coffee blended into a smooth chilled drink.",
    categoryId: "cat-cold-brew",
    imageUrl: TEMP.cold,
    basePriceMinor: 75000,
    isPopular: true,
    isAvailable: true,
    variants: [],
    modifierGroups: [],
    tags: ["cold", "mocha", "popular"],
  },
  {
    id: "prod-strawberry-matcha",
    name: "Strawberry Matcha",
    slug: "strawberry-matcha",
    description: "Earthy matcha paired with sweet and fruity strawberry flavor.",
    categoryId: "cat-matcha",
    imageUrl: TEMP.matcha,
    basePriceMinor: 85000,
    isPopular: true,
    isAvailable: true,
    variants: [],
    modifierGroups: [],
    tags: ["matcha", "strawberry", "popular"],
  },
  {
    id: "prod-pistachio-frappe",
    name: "Pistachio Frappe",
    slug: "pistachio-frappe",
    description: "A smooth and creamy frappe with rich pistachio flavor.",
    categoryId: "cat-frappe",
    imageUrl: TEMP.marshmallow,
    basePriceMinor: 95000,
    isPopular: true,
    isAvailable: true,
    variants: [],
    modifierGroups: [],
    tags: ["frappe", "pistachio", "popular"],
  },
  {
    id: "prod-bull-hit",
    name: "Bull Hit",
    slug: "bull-hit",
    description: "A bold and energizing refresher with a crisp, chilled finish.",
    categoryId: "cat-mojitos-refreshers",
    imageUrl: TEMP.cold,
    basePriceMinor: 90000,
    isPopular: true,
    isAvailable: true,
    variants: [],
    modifierGroups: [],
    tags: ["mojito", "popular"],
  },
  {
    id: "prod-liver-purifier",
    name: "Liver Purifier",
    slug: "liver-purifier",
    description: "A fresh and refreshing juice blend with clean natural flavors.",
    categoryId: "cat-juice",
    imageUrl: TEMP.cold,
    basePriceMinor: 60000,
    isPopular: true,
    isAvailable: true,
    variants: [],
    modifierGroups: [],
    tags: ["juice", "popular"],
  },
  {
    id: "prod-protein-shake",
    name: "Protein Shake",
    slug: "protein-shake",
    description: "A rich and satisfying shake packed with protein and flavor.",
    categoryId: "cat-shakes",
    imageUrl: TEMP.marshmallow,
    basePriceMinor: 110000,
    isPopular: true,
    isAvailable: true,
    variants: [],
    modifierGroups: [],
    tags: ["shake", "protein", "popular"],
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
  couponsEnabled: false,
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
