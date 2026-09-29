/**
 * Sync featured (Popular) flags to the official Popular list.
 */
import { connectMongo, disconnectMongo } from "../config/db";
import { Product } from "../models/Product";
import { logger } from "../utils/logger";

const POPULAR_SLUGS = [
  "spanish-latte",
  "cold-mocha-latte",
  "strawberry-matcha",
  "pistachio-frappe",
  "bull-hit",
  "liver-purifier",
  "protein-shake",
];

async function main() {
  await connectMongo();

  const clear = await Product.updateMany(
    { featured: true, slug: { $nin: POPULAR_SLUGS } },
    { $set: { featured: false } }
  );
  const set = await Product.updateMany(
    { slug: { $in: POPULAR_SLUGS } },
    { $set: { featured: true, isArchived: false } }
  );

  logger.info("Popular featured flags synced", {
    cleared: clear.modifiedCount,
    featured: set.modifiedCount,
    slugs: POPULAR_SLUGS,
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
