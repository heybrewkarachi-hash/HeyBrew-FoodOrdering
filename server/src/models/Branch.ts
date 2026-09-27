import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const hoursDaySchema = new Schema(
  {
    open: { type: String, required: true }, // "09:00"
    close: { type: String, required: true }, // "22:00"
    closed: { type: Boolean, default: false },
  },
  { _id: false }
);

const specialClosureSchema = new Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    reason: { type: String },
  },
  { _id: false }
);

const branchSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    address: {
      line1: { type: String, required: true },
      line2: { type: String },
      area: { type: String, required: true },
      city: { type: String, required: true, default: "Karachi" },
    },
    phone: { type: String },
    isPickupOpen: { type: Boolean, default: true },
    hours: {
      mon: hoursDaySchema,
      tue: hoursDaySchema,
      wed: hoursDaySchema,
      thu: hoursDaySchema,
      fri: hoursDaySchema,
      sat: hoursDaySchema,
      sun: hoursDaySchema,
    },
    specialClosures: { type: [specialClosureSchema], default: [] },
    orderingPaused: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type BranchDocument = InferSchemaType<typeof branchSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Branch: Model<BranchDocument> =
  mongoose.models.Branch || mongoose.model<BranchDocument>("Branch", branchSchema);
