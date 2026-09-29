import { Category } from "../models/Category";
import { Product } from "../models/Product";
import { Branch } from "../models/Branch";
import { DeliveryZone } from "../models/DeliveryZone";
import { StoreSettings } from "../models/StoreSettings";
import { notFound } from "../utils/errors";
import type { PublicSettings } from "@heybrew/shared";

export async function getMenu() {
  const [categories, products] = await Promise.all([
    Category.find({ isActive: true }).sort({ displayOrder: 1, name: 1 }),
    Product.find({ isArchived: false }).sort({ displayOrder: 1, name: 1 }),
  ]);

  return {
    categories: categories.map((c) => ({
      id: String(c._id),
      name: c.name,
      slug: c.slug,
      displayOrder: c.displayOrder,
    })),
    products: products.map((p) => serializeProduct(p)),
  };
}

export async function getProductBySlug(slug: string) {
  const product = await Product.findOne({ slug: slug.toLowerCase(), isArchived: false });
  if (!product) throw notFound("PRODUCT_NOT_FOUND", "Product not found");
  return serializeProduct(product);
}

export function serializeProduct(p: InstanceType<typeof Product>) {
  return {
    id: String(p._id),
    name: p.name,
    slug: p.slug,
    description: p.description,
    categoryId: String(p.categoryId),
    images: p.images,
    priceMinor: p.priceMinor,
    variants: p.variants,
    modifierGroups: p.modifierGroups,
    availableBranchIds: p.availableBranchIds.map(String),
    soldOutBranchIds: p.soldOutBranchIds.map(String),
    featured: p.featured,
    displayOrder: p.displayOrder,
    keywords: p.keywords,
  };
}

export async function listBranches() {
  const branches = await Branch.find({ isActive: true }).sort({ name: 1 });
  return branches.map((b) => {
    const addressLabel = [b.address?.line1, b.address?.line2, b.address?.area, b.address?.city]
      .filter(Boolean)
      .join(", ");
    return {
      id: String(b._id),
      name: b.name,
      slug: b.slug,
      address: b.address,
      addressLabel,
      mapsUrl: b.mapsUrl ?? null,
      phone: b.phone,
      isPickupOpen: b.isPickupOpen,
      hours: b.hours,
      specialClosures: b.specialClosures,
      orderingPaused: b.orderingPaused,
      isActive: b.isActive,
    };
  });
}

export async function listDeliveryZones(branchId?: string) {
  const filter: Record<string, unknown> = { isActive: true };
  if (branchId) filter.branchId = branchId;
  const zones = await DeliveryZone.find(filter).sort({ name: 1 });
  return zones.map((z) => ({
    id: String(z._id),
    name: z.name,
    branchId: String(z.branchId),
    feeMinor: z.feeMinor,
    minOrderMinor: z.minOrderMinor,
  }));
}

export async function getPublicSettings(): Promise<PublicSettings> {
  let settings = await StoreSettings.findOne({ key: "default" });
  if (!settings) {
    settings = await StoreSettings.create({ key: "default" });
  }

  return {
    storeName: settings.storeName,
    tagline: settings.tagline,
    contactPhone: settings.contactPhone ?? null,
    contactEmail: settings.contactEmail ?? null,
    whatsappNumber: settings.whatsappNumber ?? null,
    taxEnabled: settings.taxEnabled,
    taxRateBps: settings.taxRateBps,
    couponsEnabled: settings.couponsEnabled ?? false,
    banners: settings.banners.map((b) => ({
      id: b.id,
      imageUrl: b.imageUrl ?? null,
      imageUrlMobile: (b as { imageUrlMobile?: string }).imageUrlMobile ?? null,
      title: b.title ?? null,
      subtitle: b.subtitle ?? null,
      linkUrl: b.linkUrl ?? null,
      isActive: b.isActive,
    })),
    announcements: settings.announcements.map((a) => ({
      id: a.id,
      message: a.message,
      isActive: a.isActive,
      startsAt: a.startsAt ? a.startsAt.toISOString() : null,
      endsAt: a.endsAt ? a.endsAt.toISOString() : null,
    })),
    social: {
      instagram: settings.social?.instagram ?? null,
      facebook: settings.social?.facebook ?? null,
      tiktok: settings.social?.tiktok ?? null,
    },
    paymentMethods: {
      cod: settings.paymentMethods?.cod ?? true,
      card_placeholder: settings.paymentMethods?.card_placeholder ?? false,
      wallet_placeholder: settings.paymentMethods?.wallet_placeholder ?? false,
    },
    currency: "PKR",
    currencyMinorUnit: 100,
  };
}
