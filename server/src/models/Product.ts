import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const imageSchema = new Schema(
  {
    publicId: { type: String, required: true },
    url: { type: String, required: true },
    alt: { type: String },
  },
  { _id: false }
);

const variantSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    priceDeltaMinor: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const modifierOptionSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    priceDeltaMinor: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const modifierGroupSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    minSelect: { type: Number, default: 0 },
    maxSelect: { type: Number, default: 1 },
    required: { type: Boolean, default: false },
    options: { type: [modifierOptionSchema], default: [] },
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    images: { type: [imageSchema], default: [] },
    priceMinor: { type: Number, required: true, min: 0 },
    variants: { type: [variantSchema], default: [] },
    modifierGroups: { type: [modifierGroupSchema], default: [] },
    availableBranchIds: [{ type: Schema.Types.ObjectId, ref: "Branch" }],
    soldOutBranchIds: [{ type: Schema.Types.ObjectId, ref: "Branch" }],
    featured: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    isArchived: { type: Boolean, default: false },
    keywords: { type: [String], default: [] },
    /** DEVELOPMENT_SEED marker for demo products */
    developmentSeed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ categoryId: 1, displayOrder: 1 });
productSchema.index({ featured: 1, isArchived: 1 });
productSchema.index({ keywords: 1 });

export type ProductDocument = InferSchemaType<typeof productSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Product: Model<ProductDocument> =
  mongoose.models.Product || mongoose.model<ProductDocument>("Product", productSchema);
