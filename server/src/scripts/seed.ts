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
import { OFFICIAL_CATEGORIES, OFFICIAL_PRODUCTS } from "./official-menu";

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

  // Categories — official HeyBrew menu sections
  const categorySpecs = [...OFFICIAL_CATEGORIES];
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

  // Deactivate legacy category slugs (old demo names)
  await Category.updateMany(
    {
      slug: {
        $nin: categorySpecs.map((c) => c.slug),
      },
    },
    { $set: { isActive: false } }
  );

  /**
   * Official menu products with real prices (paisa = Rs × 100).
   * Replaces previous testing / Rs 150 seed items.
   */
  const productSpecs = OFFICIAL_PRODUCTS.map((p, index) => ({
    name: p.name,
    slug: p.slug,
    description: p.description,
    categorySlug: p.categorySlug,
    priceMinor: p.priceRs * 100,
    featured: Boolean(p.featured),
    displayOrder: index + 1,
    keywords: p.keywords ?? [],
  }));

  const keepSlugs = productSpecs.map((p) => p.slug);

  // Archive every product not on the official list (demo + leftover test items)
  const archived = await Product.updateMany(
    { slug: { $nin: keepSlugs } },
    { $set: { isArchived: true, featured: false } }
  );
  logger.info("Archived products not on official menu", {
    modified: archived.modifiedCount,
  });

  for (const p of productSpecs) {
    const payload = {
      name: p.name,
      slug: p.slug,
      description: p.description,
      categoryId: categoryIds[p.categorySlug],
      images: [
        {
          publicId: `menu/${p.slug}`,
          url: `https://placehold.co/600x600/3C1E18/F7F3EC/png?text=${encodeURIComponent(p.name)}`,
          alt: p.name,
        },
      ],
      priceMinor: p.priceMinor,
      variants: [],
      modifierGroups: [],
      availableBranchIds: [branch._id],
      soldOutBranchIds: [],
      featured: p.featured,
      displayOrder: p.displayOrder,
      isArchived: false,
      keywords: p.keywords,
      developmentSeed: false,
    };

    await Product.findOneAndUpdate(
      { slug: p.slug },
      { $set: payload },
      { upsert: true, new: true }
    );
  }

  logger.info("Upserted official menu products", { count: productSpecs.length });

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

  // Store settings — never clobber real Cloudinary banners / contacts already set in admin
  const existingSettings = await StoreSettings.findOne({ key: "default" });
  const existingBanners = existingSettings?.banners ?? [];
  const hasRealBanner = existingBanners.some((b) => {
    const url = `${b.imageUrl ?? ""} ${b.imageUrlMobile ?? ""}`;
    return url.includes("res.cloudinary.com") || url.includes("heybrew/banners");
  });

  const seedBanners = [
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
  ];

  const settingsSet: Record<string, unknown> = {
    storeName: existingSettings?.storeName || "HeyBrew",
    tagline: existingSettings?.tagline || "Freshly brewed, made for you",
    taxEnabled: existingSettings?.taxEnabled ?? false,
    taxRateBps: existingSettings?.taxRateBps ?? 0,
    paymentMethods: existingSettings?.paymentMethods ?? {
      cod: true,
      card_placeholder: false,
      wallet_placeholder: false,
    },
  };

  // Only fill placeholders when empty — do not reset admin uploads / contacts
  if (!existingSettings?.contactPhone) {
    settingsSet.contactPhone = "+923000000000"; // REPLACE
  }
  if (!existingSettings?.contactEmail) {
    settingsSet.contactEmail = "hello@heybrew.example"; // REPLACE
  }
  if (!existingSettings?.whatsappNumber) {
    settingsSet.whatsappNumber = "+92300REPLACE01"; // REPLACE
  }
  if (existingSettings?.couponsEnabled === undefined) {
    settingsSet.couponsEnabled = false;
  }
  if (!hasRealBanner) {
    settingsSet.banners = seedBanners;
  } else {
    logger.info("Preserving existing Cloudinary hero banners (seed will not overwrite)");
  }
  if (!existingSettings?.announcements?.length) {
    settingsSet.announcements = [
      {
        id: "dev-ann-1",
        message: "DEVELOPMENT_SEED — demo store is running on seed data",
        isActive: true,
      },
    ];
  }
  if (!existingSettings?.social?.instagram) {
    settingsSet.social = {
      instagram: existingSettings?.social?.instagram ?? "https://instagram.com/REPLACE",
      facebook: existingSettings?.social?.facebook ?? null,
      tiktok: existingSettings?.social?.tiktok ?? null,
    };
  }

  await StoreSettings.findOneAndUpdate(
    { key: "default" },
    { $set: settingsSet },
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
