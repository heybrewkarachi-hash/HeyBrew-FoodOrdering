import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import type { PaymentMethod, PaymentStatus } from "@heybrew/shared";

const paymentSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    method: {
      type: String,
      enum: ["cod", "card_placeholder", "wallet_placeholder"] satisfies PaymentMethod[],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "unpaid",
        "pending",
        "paid",
        "failed",
        "refunded",
        "partially_refunded",
      ] satisfies PaymentStatus[],
      required: true,
      default: "unpaid",
    },
    amountMinor: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "PKR" },
    provider: { type: String },
    providerRef: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export type PaymentDocument = InferSchemaType<typeof paymentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Payment: Model<PaymentDocument> =
  mongoose.models.Payment ||
  mongoose.model<PaymentDocument>("Payment", paymentSchema);
