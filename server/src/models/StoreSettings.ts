import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const bannerSchema = new Schema(
  {
    id: { type: String, required: true },
    imageUrl: { type: String }, // desktop — prefer 2880×640 (displays 1440×320)
    imageUrlMobile: { type: String }, // mobile — prefer 900×450
    title: { type: String },
    subtitle: { type: String },
    linkUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const announcementSchema = new Schema(
  {
    id: { type: String, required: true },
    message: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date },
    endsAt: { type: Date },
  },
  { _id: false }
);

const storeSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    storeName: { type: String, default: "HeyBrew" },
    tagline: { type: String, default: "Freshly brewed, made for you" },
    contactPhone: { type: String },
    contactEmail: { type: String },
    whatsappNumber: { type: String }, // seed marks REPLACE
    taxEnabled: { type: Boolean, default: false },
    taxRateBps: { type: Number, default: 0 }, // basis points; 500 = 5%
    banners: { type: [bannerSchema], default: [] },
    announcements: { type: [announcementSchema], default: [] },
    social: {
      instagram: { type: String },
      facebook: { type: String },
      tiktok: { type: String },
    },
    paymentMethods: {
      cod: { type: Boolean, default: true },
      card_placeholder: { type: Boolean, default: false },
      wallet_placeholder: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export type StoreSettingsDocument = InferSchemaType<typeof storeSettingsSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const StoreSettings: Model<StoreSettingsDocument> =
  mongoose.models.StoreSettings ||
  mongoose.model<StoreSettingsDocument>("StoreSettings", storeSettingsSchema);
