import { Router } from "express";
import { z } from "zod";
import {
  orderStatusSchema,
  orderTypeSchema,
  paginationQuerySchema,
  couponTypeSchema,
  adminRoleSchema,
} from "@heybrew/shared";
import { asyncHandler, validateBody, validateQuery } from "../middleware/errorHandler";
import { requireAdmin, requireRoles } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";
import { getDashboardStats } from "../services/dashboardService";
import {
  listAdminOrders,
  serializeAdminOrder,
  updateOrderStatus,
} from "../services/orderService";
import { Order } from "../models/Order";
import { Product } from "../models/Product";
import { Category } from "../models/Category";
import { Coupon } from "../models/Coupon";
import { Branch } from "../models/Branch";
import { DeliveryZone } from "../models/DeliveryZone";
import { StoreSettings } from "../models/StoreSettings";
import { AdminUser } from "../models/AdminUser";
import { AuditLog } from "../models/AuditLog";
import { createSignedUpload } from "../services/cloudinaryService";
import { createAdminUser } from "../services/authService";
import { writeAudit } from "../services/auditService";
import { notFound, badRequest } from "../utils/errors";
import { serializeProduct } from "../services/catalogService";

export const adminApiRouter = Router();

adminApiRouter.use(requireAdmin);

const dashboardQuerySchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  branchId: z.string().optional(),
});

adminApiRouter.get(
  "/dashboard",
  validateQuery(dashboardQuerySchema),
  asyncHandler(async (req, res) => {
    const q = (req as typeof req & { validatedQuery: z.infer<typeof dashboardQuerySchema> })
      .validatedQuery;
    res.json(
      await getDashboardStats({
        from: new Date(q.from),
        to: new Date(q.to),
        branchId: q.branchId,
      })
    );
  })
);

// Back-compat alias
adminApiRouter.get(
  "/dashboard/stats",
  asyncHandler(async (_req, res) => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    res.json(await getDashboardStats({ from, to }));
  })
);

// ——— Orders ———
const orderListSchema = paginationQuerySchema.extend({
  status: orderStatusSchema.optional(),
  type: orderTypeSchema.optional(),
  branchId: z.string().optional(),
  q: z.string().optional(),
});

adminApiRouter.get(
  "/orders",
  validateQuery(orderListSchema),
  asyncHandler(async (req, res) => {
    const q = (req as typeof req & { validatedQuery: z.infer<typeof orderListSchema> })
      .validatedQuery;
    res.json(await listAdminOrders(q));
  })
);

adminApiRouter.get(
  "/orders/:id",
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw notFound("ORDER_NOT_FOUND", "Order not found");
    res.json({ order: serializeAdminOrder(order) });
  })
);

const statusUpdateSchema = z.object({
  status: orderStatusSchema,
  version: z.number().int().min(0),
  note: z.string().max(500).optional(),
  staffNotes: z.string().max(1000).optional(),
});

adminApiRouter.patch(
  "/orders/:id/status",
  requireCsrf,
  validateBody(statusUpdateSchema),
  asyncHandler(async (req, res) => {
    const order = await updateOrderStatus({
      orderId: req.params.id,
      toStatus: req.body.status,
      expectedVersion: req.body.version,
      actor: {
        kind: "admin",
        id: req.admin!.userId,
        name: req.admin!.name,
      },
      note: req.body.note,
      staffNotes: req.body.staffNotes,
    });
    await writeAudit({
      actorId: req.admin!.userId,
      actorEmail: req.admin!.email,
      action: "order.status_update",
      resource: "Order",
      resourceId: String(order._id),
      meta: { status: order.status, version: order.version },
      ip: req.ip,
      userAgent: req.get("user-agent") ?? undefined,
    });
    res.json({ order: serializeAdminOrder(order) });
  })
);

// ——— Products ———
adminApiRouter.get(
  "/products",
  asyncHandler(async (req, res) => {
    const includeArchived = req.query.includeArchived === "true";
    const filter = includeArchived ? {} : { isArchived: false };
    const products = await Product.find(filter).sort({ displayOrder: 1, name: 1 });
    res.json({ items: products.map(serializeProduct) });
  })
);

const productBodySchema = z.object({
  name: z.string().min(1).max(160),
  slug: z.string().min(1).max(160).optional(),
  description: z.string().max(2000).optional(),
  categoryId: z.string().min(1),
  images: z
    .array(
      z.object({
        publicId: z.string(),
        url: z.string().url(),
        alt: z.string().optional(),
      })
    )
    .optional(),
  priceMinor: z.number().int().min(0),
  variants: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        priceDeltaMinor: z.number().int().default(0),
        isDefault: z.boolean().optional(),
      })
    )
    .optional(),
  modifierGroups: z.array(z.record(z.unknown())).optional(),
  availableBranchIds: z.array(z.string()).optional(),
  soldOutBranchIds: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  isArchived: z.boolean().optional(),
  keywords: z.array(z.string()).optional(),
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

adminApiRouter.post(
  "/products",
  requireRoles("owner", "manager"),
  requireCsrf,
  validateBody(productBodySchema),
  asyncHandler(async (req, res) => {
    const slug = req.body.slug ?? slugify(req.body.name);
    const product = await Product.create({ ...req.body, slug });
    await writeAudit({
      actorId: req.admin!.userId,
      actorEmail: req.admin!.email,
      action: "product.create",
      resource: "Product",
      resourceId: String(product._id),
      ip: req.ip,
    });
    res.status(201).json({ product: serializeProduct(product) });
  })
);

adminApiRouter.patch(
  "/products/:id",
  requireRoles("owner", "manager"),
  requireCsrf,
  validateBody(productBodySchema.partial()),
  asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!product) throw notFound("PRODUCT_NOT_FOUND", "Product not found");
    await writeAudit({
      actorId: req.admin!.userId,
      actorEmail: req.admin!.email,
      action: "product.update",
      resource: "Product",
      resourceId: String(product._id),
      ip: req.ip,
    });
    res.json({ product: serializeProduct(product) });
  })
);

adminApiRouter.delete(
  "/products/:id",
  requireRoles("owner", "manager"),
  requireCsrf,
  asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { isArchived: true } },
      { new: true }
    );
    if (!product) throw notFound("PRODUCT_NOT_FOUND", "Product not found");
    res.json({ product: serializeProduct(product) });
  })
);

// ——— Categories ———
adminApiRouter.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const items = await Category.find().sort({ displayOrder: 1 });
    res.json({
      items: items.map((c) => ({
        id: String(c._id),
        name: c.name,
        slug: c.slug,
        displayOrder: c.displayOrder,
        isActive: c.isActive,
      })),
    });
  })
);

const categoryBodySchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  description: z.string().optional(),
});

adminApiRouter.post(
  "/categories",
  requireRoles("owner", "manager"),
  requireCsrf,
  validateBody(categoryBodySchema),
  asyncHandler(async (req, res) => {
    const slug = req.body.slug ?? slugify(req.body.name);
    const cat = await Category.create({ ...req.body, slug });
    res.status(201).json({
      category: {
        id: String(cat._id),
        name: cat.name,
        slug: cat.slug,
        displayOrder: cat.displayOrder,
        isActive: cat.isActive,
      },
    });
  })
);

adminApiRouter.patch(
  "/categories/:id",
  requireRoles("owner", "manager"),
  requireCsrf,
  validateBody(categoryBodySchema.partial()),
  asyncHandler(async (req, res) => {
    const cat = await Category.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!cat) throw notFound("CATEGORY_NOT_FOUND", "Category not found");
    res.json({
      category: {
        id: String(cat._id),
        name: cat.name,
        slug: cat.slug,
        displayOrder: cat.displayOrder,
        isActive: cat.isActive,
      },
    });
  })
);

// ——— Coupons ———
adminApiRouter.get(
  "/coupons",
  asyncHandler(async (_req, res) => {
    const items = await Coupon.find().sort({ createdAt: -1 });
    res.json({ items });
  })
);

const couponBodySchema = z.object({
  code: z.string().min(2).max(40),
  type: couponTypeSchema,
  value: z.number().min(0),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  minOrderMinor: z.number().int().min(0).optional(),
  maxDiscountMinor: z.number().int().min(0).optional(),
  usageLimit: z.number().int().min(1).optional().nullable(),
  isActive: z.boolean().optional(),
  applicable: z
    .object({
      orderTypes: z.array(orderTypeSchema).optional(),
      branchIds: z.array(z.string()).optional(),
      categoryIds: z.array(z.string()).optional(),
      productIds: z.array(z.string()).optional(),
    })
    .optional(),
  stackingRules: z
    .object({
      allowWithOtherCoupons: z.boolean().optional(),
      exclusive: z.boolean().optional(),
    })
    .optional(),
});

adminApiRouter.post(
  "/coupons",
  requireRoles("owner", "manager"),
  requireCsrf,
  validateBody(couponBodySchema),
  asyncHandler(async (req, res) => {
    const coupon = await Coupon.create({
      ...req.body,
      code: req.body.code.toUpperCase(),
    });
    res.status(201).json({ coupon });
  })
);

adminApiRouter.patch(
  "/coupons/:id",
  requireRoles("owner", "manager"),
  requireCsrf,
  validateBody(couponBodySchema.partial()),
  asyncHandler(async (req, res) => {
    const update = { ...req.body };
    if (update.code) update.code = update.code.toUpperCase();
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!coupon) throw notFound("COUPON_NOT_FOUND", "Coupon not found");
    res.json({ coupon });
  })
);

// ——— Branches ———
adminApiRouter.get(
  "/branches",
  asyncHandler(async (_req, res) => {
    res.json({ items: await Branch.find().sort({ name: 1 }) });
  })
);

const branchBodySchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  address: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    area: z.string(),
    city: z.string().default("Karachi"),
  }),
  phone: z.string().optional(),
  isPickupOpen: z.boolean().optional(),
  hours: z.record(z.unknown()).optional(),
  specialClosures: z.array(z.unknown()).optional(),
  orderingPaused: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

adminApiRouter.post(
  "/branches",
  requireRoles("owner", "manager"),
  requireCsrf,
  validateBody(branchBodySchema),
  asyncHandler(async (req, res) => {
    const slug = req.body.slug ?? slugify(req.body.name);
    const branch = await Branch.create({ ...req.body, slug });
    res.status(201).json({ branch });
  })
);

adminApiRouter.patch(
  "/branches/:id",
  requireRoles("owner", "manager"),
  requireCsrf,
  validateBody(branchBodySchema.partial()),
  asyncHandler(async (req, res) => {
    const branch = await Branch.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!branch) throw notFound("BRANCH_NOT_FOUND", "Branch not found");
    res.json({ branch });
  })
);

// ——— Delivery zones ———
adminApiRouter.get(
  "/delivery-zones",
  asyncHandler(async (_req, res) => {
    res.json({ items: await DeliveryZone.find().sort({ name: 1 }) });
  })
);

const zoneBodySchema = z.object({
  name: z.string().min(1),
  branchId: z.string().min(1),
  feeMinor: z.number().int().min(0),
  minOrderMinor: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  polygonNote: z.string().optional(),
});

adminApiRouter.post(
  "/delivery-zones",
  requireRoles("owner", "manager"),
  requireCsrf,
  validateBody(zoneBodySchema),
  asyncHandler(async (req, res) => {
    const zone = await DeliveryZone.create(req.body);
    res.status(201).json({ zone });
  })
);

adminApiRouter.patch(
  "/delivery-zones/:id",
  requireRoles("owner", "manager"),
  requireCsrf,
  validateBody(zoneBodySchema.partial()),
  asyncHandler(async (req, res) => {
    const zone = await DeliveryZone.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!zone) throw notFound("ZONE_NOT_FOUND", "Zone not found");
    res.json({ zone });
  })
);

// ——— Settings ———
adminApiRouter.get(
  "/settings",
  asyncHandler(async (_req, res) => {
    let settings = await StoreSettings.findOne({ key: "default" });
    if (!settings) settings = await StoreSettings.create({ key: "default" });
    res.json({ settings });
  })
);

const settingsBodySchema = z.object({
  storeName: z.string().optional(),
  tagline: z.string().optional(),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  whatsappNumber: z.string().optional().nullable(),
  taxEnabled: z.boolean().optional(),
  taxRateBps: z.number().int().min(0).max(10000).optional(),
  banners: z.array(z.record(z.unknown())).optional(),
  announcements: z.array(z.record(z.unknown())).optional(),
  social: z
    .object({
      instagram: z.string().optional().nullable(),
      facebook: z.string().optional().nullable(),
      tiktok: z.string().optional().nullable(),
    })
    .optional(),
  paymentMethods: z
    .object({
      cod: z.boolean().optional(),
      card_placeholder: z.boolean().optional(),
      wallet_placeholder: z.boolean().optional(),
    })
    .optional(),
});

adminApiRouter.patch(
  "/settings",
  requireRoles("owner", "manager"),
  requireCsrf,
  validateBody(settingsBodySchema),
  asyncHandler(async (req, res) => {
    const settings = await StoreSettings.findOneAndUpdate(
      { key: "default" },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json({ settings });
  })
);

// ——— Users ———
adminApiRouter.get(
  "/users",
  requireRoles("owner"),
  asyncHandler(async (_req, res) => {
    const users = await AdminUser.find().select("-passwordHash -sessions");
    res.json({
      items: users.map((u) => ({
        id: String(u._id),
        email: u.email,
        name: u.name,
        role: u.role,
        permissions: u.permissions,
        branchIds: u.branchIds.map(String),
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt,
      })),
    });
  })
);

const userCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(10),
  role: adminRoleSchema,
  permissions: z.array(z.string()).optional(),
  branchIds: z.array(z.string()).optional(),
});

adminApiRouter.post(
  "/users",
  requireRoles("owner"),
  requireCsrf,
  validateBody(userCreateSchema),
  asyncHandler(async (req, res) => {
    if (req.body.role === "owner" && req.admin!.role !== "owner") {
      throw badRequest("ROLE_FORBIDDEN", "Cannot create owner");
    }
    const user = await createAdminUser(req.body);
    res.status(201).json({
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  })
);

// ——— Cloudinary signed upload ———
adminApiRouter.post(
  "/uploads/cloudinary-sign",
  requireRoles("owner", "manager"),
  requireCsrf,
  validateBody(
    z.object({
      folder: z.string().optional(),
      publicId: z.string().optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    res.json(createSignedUpload(req.body));
  })
);

// ——— Audit logs ———
adminApiRouter.get(
  "/audit-logs",
  requireRoles("owner", "manager"),
  validateQuery(paginationQuerySchema),
  asyncHandler(async (req, res) => {
    const q = (req as typeof req & { validatedQuery: z.infer<typeof paginationQuerySchema> })
      .validatedQuery;
    const skip = (q.page - 1) * q.limit;
    const [items, total] = await Promise.all([
      AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(q.limit),
      AuditLog.countDocuments(),
    ]);
    res.json({ items, page: q.page, limit: q.limit, total });
  })
);
