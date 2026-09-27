const mongoose = require("mongoose");

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/heybrew");
  const c = mongoose.connection.db.collection("categories");
  const names = {
    popular: "Popular",
    "hot-brew": "Hot Brew",
    "cold-brew": "Cold Brew",
    frappe: "Frappe",
    matcha: "Matcha",
    mojito: "Mojito",
  };
  for (const [slug, name] of Object.entries(names)) {
    await c.updateOne({ slug }, { $set: { name } });
  }
  console.log(
    await c
      .find({})
      .project({ slug: 1, name: 1, displayOrder: 1 })
      .sort({ displayOrder: 1 })
      .toArray()
  );
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
