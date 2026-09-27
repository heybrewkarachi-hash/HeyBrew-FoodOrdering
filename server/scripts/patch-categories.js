const mongoose = require("mongoose");

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/heybrew");
  const cats = mongoose.connection.db.collection("categories");
  const products = mongoose.connection.db.collection("products");

  const order = [
    ["popular", 1],
    ["hot-brew", 2],
    ["cold-brew", 3],
    ["frappe", 4],
    ["matcha", 5],
    ["mojito", 6],
  ];
  for (const [slug, displayOrder] of order) {
    await cats.updateOne(
      { slug },
      { $set: { displayOrder, isActive: true, name: slug === "frappe" ? "Frappe" : slug === "mojito" ? "Mojito" : undefined } },
      { upsert: false }
    );
  }
  // Fix names properly
  await cats.updateOne({ slug: "frappe" }, { $set: { name: "Frappe", displayOrder: 4, isActive: true } }, { upsert: true });
  await cats.updateOne({ slug: "mojito" }, { $set: { name: "Mojito", displayOrder: 6, isActive: true } }, { upsert: true });
  await cats.updateOne({ slug: "matcha" }, { $set: { displayOrder: 5 } });

  const frappe = await cats.findOne({ slug: "frappe" });
  const mojito = await cats.findOne({ slug: "mojito" });

  if (frappe && !(await products.findOne({ slug: "caramel-frappe" }))) {
    await products.insertOne({
      name: "Caramel Frappe",
      slug: "caramel-frappe",
      description: "DEVELOPMENT_SEED — blended caramel coffee frappe",
      categoryId: frappe._id,
      images: [{ publicId: "development_seed/caramel-frappe", url: "https://placehold.co/600x600/png?text=Frappe", alt: "Caramel Frappe" }],
      priceMinor: 70000,
      variants: [{ id: "regular", name: "Regular", priceDeltaMinor: 0, isDefault: true }],
      modifierGroups: [],
      availableBranchIds: [],
      soldOutBranchIds: [],
      featured: false,
      displayOrder: 0,
      isArchived: false,
      keywords: ["frappe"],
      developmentSeed: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  if (mojito && !(await products.findOne({ slug: "classic-mojito" }))) {
    await products.insertOne({
      name: "Classic Mojito",
      slug: "classic-mojito",
      description: "DEVELOPMENT_SEED — mint, lime, soda (non-alcoholic)",
      categoryId: mojito._id,
      images: [{ publicId: "development_seed/classic-mojito", url: "https://placehold.co/600x600/png?text=Mojito", alt: "Classic Mojito" }],
      priceMinor: 50000,
      variants: [{ id: "regular", name: "Regular", priceDeltaMinor: 0, isDefault: true }],
      modifierGroups: [],
      availableBranchIds: [],
      soldOutBranchIds: [],
      featured: false,
      displayOrder: 0,
      isArchived: false,
      keywords: ["mojito"],
      developmentSeed: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  console.log("categories", await cats.find({}).project({ slug: 1, displayOrder: 1, name: 1 }).sort({ displayOrder: 1 }).toArray());
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
