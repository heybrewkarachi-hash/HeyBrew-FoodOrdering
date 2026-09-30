/**
 * Restore admin-uploaded Cloudinary hero after seed overwrote banners with Unsplash.
 */
import { connectMongo, disconnectMongo } from "../config/db";
import { StoreSettings } from "../models/StoreSettings";
import { logger } from "../utils/logger";

const DESKTOP =
  "https://res.cloudinary.com/zf7b5pyd/image/upload/v1790597969/heybrew/banners/vhlwhb5tp2nkkzbyzonh.png";
const MOBILE =
  "https://res.cloudinary.com/zf7b5pyd/image/upload/v1790597972/heybrew/banners/ibn9kfpoooltha8k3f8i.png";

async function main() {
  await connectMongo();

  const settings = await StoreSettings.findOneAndUpdate(
    { key: "default" },
    {
      $set: {
        banners: [
          {
            id: "hero-1",
            imageUrl: DESKTOP,
            imageUrlMobile: MOBILE,
            title: "HeyBrew",
            subtitle: null,
            linkUrl: "#menu",
            isActive: true,
          },
        ],
      },
    },
    { new: true, upsert: true }
  );

  logger.info("Restored Cloudinary hero banners", {
    desktop: DESKTOP,
    mobile: MOBILE,
    count: settings?.banners?.length ?? 0,
  });

  await disconnectMongo();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await disconnectMongo();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
