import type { CreateOrderInput, OrderStatus, StatusActor } from "@heybrew/shared";
import { Order } from "../models/Order";
import { Payment } from "../models/Payment";
import { Coupon } from "../models/Coupon";
import { validateCart } from "./cartService";
import { assertTransition, buildStatusHistoryEntry } from "./orderTransitions";
import { generateAccessToken, generateOrderNumber, sha256 } from "../utils/crypto";
import { conflict, forbidden, notFound } from "../utils/errors";
import { getIo } from "../sockets/ioRegistry";

export async function createOrder(
  input: CreateOrderInput,
  idempotencyKey: string
) {
  const existing = await Order.findOne({ idempotencyKey });
  if (existing) {
    return serializePublicOrder(existing, true);
  }

  const priced = await validateCart({
    type: input.type,
    branchId: input.branchId,
    deliveryZoneId: input.deliveryZoneId,
    items: input.items,
    couponCode: input.couponCode,
  });

  const accessToken = generateAccessToken();
  const orderNumber = generateOrderNumber();

  const order = await Order.create({
    orderNumber,
    accessToken,
    accessTokenHash: sha256(accessToken),
    type: input.type,
    status: "pending",
    statusHistory: [
      buildStatusHistoryEntry("pending", { kind: "customer", name: input.customer.name }),
    ],
    customer: {
      name: input.customer.name,
      phone: input.customer.phone,
      email: input.customer.email ?? undefined,
    },
    address: input.type === "delivery" ? input.address ?? undefined : undefined,
    items: priced.items.map((line) => ({
      productId: line.productId,
      productName: line.productName,
      productSlug: line.productSlug,
      variantId: line.variantId,
      variantName: line.variantName,
      unitPriceMinor: line.unitPriceMinor,
      modifiers: line.modifiers,
      quantity: line.quantity,
      lineTotalMinor: line.lineTotalMinor,
      notes: line.notes ?? undefined,
    })),
    totals: priced.totals,
    coupon: priced.coupon ?? undefined,
    paymentStatus: "unpaid",
    paymentMethod: input.paymentMethod,
    idempotencyKey,
    version: 0,
    branchId: input.branchId,
    deliveryZoneId: input.deliveryZoneId ?? undefined,
    notes: input.notes ?? undefined,
  });

  await Payment.create({
    orderId: order._id,
    method: input.paymentMethod,
    status: "unpaid",
    amountMinor: priced.totals.totalMinor,
    currency: "PKR",
    provider: input.paymentMethod === "cod" ? "cod" : "placeholder",
  });

  if (priced.coupon?.code) {
    await Coupon.updateOne(
      { code: priced.coupon.code },
      { $inc: { usedCount: 1 } }
    );
  }

  const io = getIo();
  if (io) {
    const at = new Date().toISOString();
    io.to("admin:orders").emit("order:new", {
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      type: order.type,
      status: order.status,
      version: order.version,
      createdAt: order.createdAt,
      at,
      customer: {
        name: order.customer.name,
        phone: order.customer.phone,
      },
      address: order.address
        ? {
            line1: order.address.line1,
            line2: order.address.line2 ?? null,
            area: order.address.area,
            city: order.address.city,
            landmark: order.address.landmark ?? null,
          }
        : null,
      branchId: String(order.branchId),
      items: order.items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        lineTotalMinor: item.lineTotalMinor,
      })),
      totals: {
        subtotalMinor: order.totals?.subtotalMinor ?? 0,
        deliveryFeeMinor: order.totals?.deliveryFeeMinor ?? 0,
        discountMinor: order.totals?.discountMinor ?? 0,
        totalMinor: order.totals?.totalMinor ?? 0,
      },
    });
    io.to(`order:${order._id}`).emit("order:updated", {
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      status: order.status,
      at,
    });
  }

  return {
    ...serializePublicOrder(order, false),
    accessToken, // only returned once at creation
  };
}

export async function trackOrder(orderNumber: string, token: string | undefined) {
  if (!token) {
    throw forbidden(
      "TRACK_TOKEN_REQUIRED",
      "Order access token is required. Orders cannot be looked up by phone alone."
    );
  }

  const order = await Order.findOne({ orderNumber }).select("+accessToken");
  if (!order) {
    throw notFound("ORDER_NOT_FOUND", "Order not found");
  }

  const tokenHash = sha256(token);
  if (order.accessTokenHash !== tokenHash) {
    // Also accept raw accessToken match if selected
    if (order.accessToken !== token) {
      throw forbidden("TRACK_FORBIDDEN", "Invalid order access token");
    }
  }

  return serializePublicOrder(order, false);
}

export async function updateOrderStatus(params: {
  orderId: string;
  toStatus: OrderStatus;
  expectedVersion: number;
  actor: StatusActor;
  note?: string;
  staffNotes?: string;
}) {
  const order = await Order.findById(params.orderId);
  if (!order) throw notFound("ORDER_NOT_FOUND", "Order not found");

  if (order.version !== params.expectedVersion) {
    throw conflict("VERSION_CONFLICT", "Order was modified by another request", {
      currentVersion: order.version,
    });
  }

  assertTransition(order.type, order.status as OrderStatus, params.toStatus);

  order.status = params.toStatus;
  order.statusHistory.push(
    buildStatusHistoryEntry(params.toStatus, params.actor, params.note)
  );
  order.version += 1;
  if (params.staffNotes !== undefined) {
    order.staffNotes = params.staffNotes;
  }

  if (params.toStatus === "delivered" || params.toStatus === "collected") {
    if (order.paymentMethod === "cod") {
      order.paymentStatus = "paid";
      await Payment.updateOne(
        { orderId: order._id },
        { $set: { status: "paid" } }
      );
    }
  }

  await order.save();

  const io = getIo();
  if (io) {
    const payload = {
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      status: order.status,
      version: order.version,
      at: new Date().toISOString(),
    };
    io.to("admin:orders").emit("order:updated", payload);
    io.to(`order:${order._id}`).emit("order:updated", payload);
  }

  return order;
}

export function serializePublicOrder(
  order: InstanceType<typeof Order>,
  includeAccessToken: boolean
) {
  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    type: order.type,
    status: order.status,
    statusHistory: order.statusHistory,
    customer: {
      name: order.customer.name,
      phone: maskPhone(order.customer.phone),
    },
    address: order.address
      ? {
          area: order.address.area,
          city: order.address.city,
          // full address only with token at create; public track masks street
          line1: includeAccessToken ? order.address.line1 : maskAddress(order.address.line1),
          line2: order.address.line2,
          landmark: order.address.landmark,
        }
      : null,
    items: order.items,
    totals: order.totals,
    coupon: order.coupon ?? null,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    branchId: String(order.branchId),
    deliveryZoneId: order.deliveryZoneId ? String(order.deliveryZoneId) : null,
    notes: order.notes ?? null,
    version: order.version,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    ...(includeAccessToken && order.accessToken
      ? { accessToken: order.accessToken }
      : {}),
  };
}

export function serializeAdminOrder(order: InstanceType<typeof Order>) {
  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    type: order.type,
    status: order.status,
    statusHistory: order.statusHistory,
    customer: order.customer,
    address: order.address ?? null,
    items: order.items,
    totals: order.totals,
    coupon: order.coupon ?? null,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    branchId: String(order.branchId),
    deliveryZoneId: order.deliveryZoneId ? String(order.deliveryZoneId) : null,
    notes: order.notes ?? null,
    staffNotes: order.staffNotes ?? null,
    version: order.version,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function maskPhone(phone: string): string {
  if (phone.length < 6) return "***";
  return `${phone.slice(0, 4)}****${phone.slice(-2)}`;
}

function maskAddress(line: string): string {
  if (line.length <= 8) return "***";
  return `${line.slice(0, 4)}…`;
}

export async function listAdminOrders(query: {
  page: number;
  limit: number;
  status?: string;
  type?: string;
  branchId?: string;
  q?: string;
}) {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.branchId) filter.branchId = query.branchId;
  if (query.q) {
    const q = query.q.trim();
    filter.$or = [
      { orderNumber: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      { "customer.name": new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      { "customer.phone": q },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    Order.countDocuments(filter),
  ]);

  return {
    items: items.map(serializeAdminOrder),
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.ceil(total / query.limit) || 1,
  };
}
