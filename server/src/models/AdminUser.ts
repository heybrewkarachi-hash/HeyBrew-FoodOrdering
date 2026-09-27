import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import type { AdminRole } from "@heybrew/shared";

const sessionSchema = new Schema(
  {
    tokenHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    userAgent: { type: String },
    ip: { type: String },
  },
  { _id: true }
);

const adminUserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["owner", "manager", "staff"] satisfies AdminRole[],
      required: true,
      default: "staff",
    },
    permissions: { type: [String], default: [] },
    branchIds: [{ type: Schema.Types.ObjectId, ref: "Branch" }],
    isActive: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
    sessions: { type: [sessionSchema], default: [] },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export type AdminUserDocument = InferSchemaType<typeof adminUserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AdminUser: Model<AdminUserDocument> =
  mongoose.models.AdminUser ||
  mongoose.model<AdminUserDocument>("AdminUser", adminUserSchema);
