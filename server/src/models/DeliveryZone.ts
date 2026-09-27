import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const deliveryZoneSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true, index: true },
    feeMinor: { type: Number, required: true, min: 0 },
    minOrderMinor: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
    polygonNote: { type: String }, // descriptive for demo; real geo later
  },
  { timestamps: true }
);

export type DeliveryZoneDocument = InferSchemaType<typeof deliveryZoneSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const DeliveryZone: Model<DeliveryZoneDocument> =
  mongoose.models.DeliveryZone ||
  mongoose.model<DeliveryZoneDocument>("DeliveryZone", deliveryZoneSchema);
