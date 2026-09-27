import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    description: { type: String },
  },
  { timestamps: true }
);

categorySchema.index({ displayOrder: 1 });

export type CategoryDocument = InferSchemaType<typeof categorySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Category: Model<CategoryDocument> =
  mongoose.models.Category ||
  mongoose.model<CategoryDocument>("Category", categorySchema);
