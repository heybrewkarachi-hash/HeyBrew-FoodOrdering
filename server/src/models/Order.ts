import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import type { OrderStatus, OrderType, PaymentMethod, PaymentStatus } from "@heybrew/shared";

const statusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "on_the_way",
        "delivered",
        "ready_for_pickup",
        "collected",
        "cancelled",
      ] satisfies OrderStatus[],
      required: true,
    },
    at: { type: Date, required: true, default: Date.now },
    actor: {
      kind: { type: String, enum: ["customer", "admin", "system"], required: true },
      id: { type: String },
      name: { type: String },
    },
    note: { type: String },
  },
  { _id: false }
);

const orderItemModifierSchema = new Schema(
  {
    groupId: { type: String, required: true },
    optionId: { type: String, required: true },
    name: { type: String, required: true },
    priceDeltaMinor: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    productSlug: { type: String, required: true },
    variantId: { type: String },
    variantName: { type: String },
    unitPriceMinor: { type: Number, required: true }, // base + variant at order time
    modifiers: { type: [orderItemModifierSchema], default: [] },
    quantity: { type: Number, required: true, min: 1 },
    lineTotalMinor: { type: Number, required: true },
    notes: { type: String },
  },
  { _id: true }
);

const customerSnapshotSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true }, // E.164
    email: { type: String },
  },
  { _id: false }
);

const addressSnapshotSchema = new Schema(
  {
    line1: { type: String, required: true },
    line2: { type: String },
    area: { type: String, required: true },
    city: { type: String, required: true },
    landmark: { type: String },
  },
  { _id: false }
);

const couponSnapshotSchema = new Schema(
  {
    code: { type: String, required: true },
    type: { type: String, enum: ["percent", "fixed"], required: true },
    value: { type: Number, required: true },
    discountMinor: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    accessToken: { type: String, required: true, select: false },
    accessTokenHash: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["delivery", "pickup"] satisfies OrderType[],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "on_the_way",
        "delivered",
        "ready_for_pickup",
        "collected",
        "cancelled",
      ] satisfies OrderStatus[],
      required: true,
      default: "pending",
      index: true,
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
    customer: { type: customerSnapshotSchema, required: true },
    address: { type: addressSnapshotSchema },
    items: { type: [orderItemSchema], required: true },
    totals: {
      subtotalMinor: { type: Number, required: true },
      deliveryFeeMinor: { type: Number, required: true, default: 0 },
      discountMinor: { type: Number, required: true, default: 0 },
      taxMinor: { type: Number, required: true, default: 0 },
      totalMinor: { type: Number, required: true },
    },
    coupon: { type: couponSnapshotSchema },
    paymentStatus: {
      type: String,
      enum: [
        "unpaid",
        "pending",
        "paid",
        "failed",
        "refunded",
        "partially_refunded",
      ] satisfies PaymentStatus[],
      default: "unpaid",
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "card_placeholder", "wallet_placeholder"] satisfies PaymentMethod[],
      default: "cod",
    },
    idempotencyKey: { type: String, required: true, unique: true },
    version: { type: Number, default: 0 },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true, index: true },
    deliveryZoneId: { type: Schema.Types.ObjectId, ref: "DeliveryZone" },
    notes: { type: String },
    staffNotes: { type: String },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ "customer.phone": 1 }); // for admin search only — never public history by phone

export type OrderDocument = InferSchemaType<typeof orderSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Order: Model<OrderDocument> =
  mongoose.models.Order || mongoose.model<OrderDocument>("Order", orderSchema);
