/**
 * DEVELOPMENT_SEED — demo data for local/dev only.
 * Requires ADMIN_EMAIL and ADMIN_PASSWORD in env (no default password in code).
 */
import { connectMongo, disconnectMongo } from "../config/db";
import { env } from "../config/env";
import { Branch } from "../models/Branch";
import { DeliveryZone } from "../models/DeliveryZone";
import { Category } from "../models/Category";
import { Product } from "../models/Product";
import { Coupon } from "../models/Coupon";
import { StoreSettings } from "../models/StoreSettings";
import { createAdminUser, hashPassword } from "../services/authService";
import { AdminUser } from "../models/AdminUser";
import { logger } from "../utils/logger";

const DEFAULT_HOURS = {
  open: "09:00",
  close: "23:00",
  closed: false,
};

async function seed() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD are required to run seed (no default password in code)"
    );
  }

  await connectMongo();

  // Owner admin
  let owner = await AdminUser.findOne({ email: env.ADMIN_EMAIL.toLowerCase() });
  if (!owner) {
    owner = await createAdminUser({
      email: env.ADMIN_EMAIL,
      name: "HeyBrew Owner",
      password: env.ADMIN_PASSWORD,
      role: "owner",
      permissions: ["*"],
    });
    logger.info("Created owner admin", { email: owner.email });
  } else {
    // Keep seed password in sync with env (useful after first deploy)
    owner.passwordHash = await hashPassword(env.ADMIN_PASSWORD);
    await owner.save();
    logger.info("Owner admin already exists — password synced from env", {
      email: owner.email,
    });
  }

  // Bahadurabad branch
  let branch = await Branch.findOne({ slug: "heybrew-bahadurabad" });
  if (!branch) {
    branch = await Branch.findOne({ slug: "heybrew-demo-branch" });
  }
  if (!branch) {
    branch = await Branch.create({
      name: "HeyBrew Bahadurabad",
      slug: "heybrew-bahadurabad",
      address: {
        line1: "293 Bahadurabad Rd No. 15",
        line2: "Bahadurabad Bahadur Yar Jang CHS",
        area: "Bahadurabad",
        city: "Karachi",
      },
      mapsUrl: "https://maps.app.goo.gl/Ti3HrY1thNrRXa3G9",
      phone: "+923001234567",
      isPickupOpen: true,
      hours: {
        mon: DEFAULT_HOURS,
        tue: DEFAULT_HOURS,
        wed: DEFAULT_HOURS,
        thu: DEFAULT_HOURS,
        fri: DEFAULT_HOURS,
        sat: DEFAULT_HOURS,
        sun: DEFAULT_HOURS,
      },
      specialClosures: [],
      orderingPaused: false,
      isActive: true,
    });
    logger.info("Created Bahadurabad branch", { id: String(branch._id) });
  } else {
    branch.name = "HeyBrew Bahadurabad";
    branch.slug = "heybrew-bahadurabad";
    branch.address = {
      line1: "293 Bahadurabad Rd No. 15",
      line2: "Bahadurabad Bahadur Yar Jang CHS",
      area: "Bahadurabad",
      city: "Karachi",
    };
    branch.mapsUrl = "https://maps.app.goo.gl/Ti3HrY1thNrRXa3G9";
    branch.isActive = true;
    await branch.save();
  }

  // Delivery zones
  const zoneSpecs = [
    { name: "Clifton / DHA (demo)", feeMinor: 15000, minOrderMinor: 0 },
    { name: "PECHS / Gulshan (demo)", feeMinor: 20000, minOrderMinor: 0 },
  ];
  for (const z of zoneSpecs) {
    const existing = await DeliveryZone.findOne({ name: z.name, branchId: branch._id });
    if (!existing) {
      await DeliveryZone.create({
        ...z,
        branchId: branch._id,
        isActive: true,
        polygonNote: "DEVELOPMENT_SEED — replace with real zone geometry",
      });
    }
  }

  // Categories — HeyBrew menu sections (Popular = featured from each)
  const categorySpecs = [
    { name: "Popular", slug: "popular", displayOrder: 1 },
    { name: "Hot Brew", slug: "hot-brew", displayOrder: 2 },
    { name: "Cold Brew", slug: "cold-brew", displayOrder: 3 },
    { name: "Frappe", slug: "frappe", displayOrder: 4 },
    { name: "Matcha", slug: "matcha", displayOrder: 5 },
    { name: "Speciality", slug: "speciality", displayOrder: 6 },
    { name: "Mojitos", slug: "mojitos", displayOrder: 7 },
    { name: "Shake", slug: "shake", displayOrder: 8 },
    { name: "Juice", slug: "juice", displayOrder: 9 },
    { name: "Dessert", slug: "dessert", displayOrder: 10 },
  ];
  const categoryIds: Record<string, string> = {};
  for (const c of categorySpecs) {
    let cat = await Category.findOne({ slug: c.slug });
    if (!cat) {
      cat = await Category.create({ ...c, isActive: true });
    } else {
      cat.name = c.name;
      cat.displayOrder = c.displayOrder;
      cat.isActive = true;
      await cat.save();
    }
    categoryIds[c.slug] = String(cat._id);
  }

  // Deactivate legacy demo category slugs
  await Category.updateMany(
    {
      slug: {
        $nin: categorySpecs.map((c) => c.slug),
      },
    },
    { $set: { isActive: false } }
  );

  /**
   * Popular item from each category (names from HeyBrew).
   * Prices are 0 until the official menu prices are entered in admin.
   */
  const productSpecs = [
    {
      name: "Spanish Latte",
      slug: "spanish-latte",
      description: "Hot Brew favourite.",
      categorySlug: "hot-brew",
      priceMinor: 15000,
      featured: true,
      displayOrder: 1,
      keywords: ["hot", "latte", "spanish", "popular"],
    },
    {
      name: "Mocha Latte",
      slug: "mocha-latte",
      description: "Cold Brew favourite.",
      categorySlug: "cold-brew",
      priceMinor: 15000,
      featured: true,
      displayOrder: 1,
      keywords: ["cold", "mocha", "latte", "popular"],
    },
    {
      name: "Pistachio Frappe",
      slug: "pistachio-frappe",
      description: "Frappe favourite.",
      categorySlug: "frappe",
      priceMinor: 15000,
      featured: true,
      displayOrder: 1,
      keywords: ["frappe", "pistachio", "popular"],
    },
    {
      name: "Strawberry Matcha",
      slug: "strawberry-matcha",
      description: "Matcha favourite.",
      categorySlug: "matcha",
      priceMinor: 15000,
      featured: true,
      displayOrder: 1,
      keywords: ["matcha", "strawberry", "popular"],
    },
    {
      name: "Bull Hit",
      slug: "bull-hit",
      description: "Mojitos favourite.",
      categorySlug: "mojitos",
      priceMinor: 15000,
      featured: true,
      displayOrder: 1,
      keywords: ["mojito", "bull hit", "popular"],
    },
    {
      name: "Protein Shake",
      slug: "protein-shake",
      description: "Shake favourite.",
      categorySlug: "shake",
      priceMinor: 15000,
      featured: true,
      displayOrder: 1,
      keywords: ["shake", "protein", "popular"],
    },
    {
      name: "Liver Purifier",
      slug: "liver-purifier",
      description: "Juice favourite.",
      categorySlug: "juice",
      priceMinor: 15000,
      featured: true,
      displayOrder: 1,
      keywords: ["juice", "liver purifier", "popular"],
    },
  ];

  const keepSlugs = productSpecs.map((p) => p.slug);

  // Archive old DEVELOPMENT_SEED products not on this list
  await Product.updateMany(
    { developmentSeed: true, slug: { $nin: keepSlugs } },
    { $set: { isArchived: true, featured: false } }
  );

  for (const p of productSpecs) {
    const payload = {
      name: p.name,
      slug: p.slug,
      description: p.description,
      categoryId: categoryIds[p.categorySlug],
      images: [
        {
          publicId: `development_seed/${p.slug}`,
          url: `https://placehold.co/600x600/png?text=${encodeURIComponent(p.name)}`,
          alt: `${p.name} — Temporary placeholder image (DEVELOPMENT_SEED)`,
        },
      ],
      priceMinor: p.priceMinor,
      // No size variants until they exist on the official menu
      variants: [],
      modifierGroups: [],
      availableBranchIds: [branch._id],
      soldOutBranchIds: [],
      featured: p.featured,
      displayOrder: p.displayOrder,
      isArchived: false,
      keywords: p.keywords,
      developmentSeed: true,
    };

    await Product.findOneAndUpdate(
      { slug: p.slug },
      { $set: payload },
      { upsert: true, new: true }
    );
  }

  // Sample coupon SAVE75 — Rs 75 off (7500 paisa) fixed
  const couponCode = "SAVE75";
  let coupon = await Coupon.findOne({ code: couponCode });
  if (!coupon) {
    const now = new Date();
    const ends = new Date();
    ends.setFullYear(ends.getFullYear() + 1);
    coupon = await Coupon.create({
      code: couponCode,
      type: "fixed",
      value: 7500,
      startsAt: now,
      endsAt: ends,
      minOrderMinor: 30000,
      usageLimit: 1000,
      usedCount: 0,
      isActive: true,
      applicable: {
        orderTypes: ["delivery", "pickup"],
        branchIds: [branch._id],
      },
      stackingRules: { allowWithOtherCoupons: false, exclusive: true },
      developmentSeed: true,
    });
    logger.info("Created coupon SAVE75");
  }

  // Store settings — WhatsApp marked REPLACE
  await StoreSettings.findOneAndUpdate(
    { key: "default" },
    {
      $set: {
        storeName: "HeyBrew",
        tagline: "Freshly brewed, made for you",
        contactPhone: "+923000000000", // REPLACE
        contactEmail: "hello@heybrew.example", // REPLACE
        whatsappNumber: "+92300REPLACE01", // REPLACE — placeholder WhatsApp
        taxEnabled: false,
        taxRateBps: 0,
        banners: [
          {
            id: "dev-banner-1",
            title: "Your daily brew, delivered.",
            subtitle:
              "DEVELOPMENT_SEED — replace with 2880×640 desktop + 900×450 mobile crops",
            imageUrl:
              "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=2880&h=640&fit=crop&q=80",
            imageUrlMobile:
              "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&h=450&fit=crop&q=80",
            isActive: true,
          },
        ],
        announcements: [
          {
            id: "dev-ann-1",
            message: "DEVELOPMENT_SEED — demo store is running on seed data",
            isActive: true,
          },
        ],
        social: {
          instagram: "https://instagram.com/REPLACE",
          facebook: null,
          tiktok: null,
        },
        paymentMethods: {
          cod: true,
          card_placeholder: false,
          wallet_placeholder: false,
        },
      },
    },
    { upsert: true }
  );

  logger.info("Seed complete", {
    branchId: String(branch._id),
    adminEmail: env.ADMIN_EMAIL,
    note: "All DEVELOPMENT_SEED / REPLACE markers should be updated before production",
  });

  await disconnectMongo();
}

seed().catch(async (err) => {
  console.error(err);
  try {
    await disconnectMongo();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
