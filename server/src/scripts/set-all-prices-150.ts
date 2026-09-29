/**
 * Set every product to Rs 150 and strip TBA / placeholder price copy from descriptions.
 */
import { connectMongo, disconnectMongo } from "../config/db";
import { Product } from "../models/Product";
import { logger } from "../utils/logger";

const PRICE_MINOR = 150 * 100; // Rs 150

function cleanDescription(raw: string): string {
  return raw
    .replace(/Price TBA[^.]*\.?/gi, "")
    .replace(/\s*Set price from official menu\.?/gi, "")
    .replace(/\s*DEVELOPMENT_SEED\s*[—-]?\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function main() {
  await connectMongo();

  const products = await Product.find({});
  let updated = 0;
  for (const p of products) {
    const nextDesc = cleanDescription(p.description ?? "");
    const needsPrice = p.priceMinor !== PRICE_MINOR;
    const needsDesc = nextDesc !== (p.description ?? "");
    if (!needsPrice && !needsDesc) continue;
    p.priceMinor = PRICE_MINOR;
    p.description = nextDesc;
    await p.save();
    updated += 1;
  }

  logger.info("Product prices set to Rs 150", {
    total: products.length,
    updated,
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
