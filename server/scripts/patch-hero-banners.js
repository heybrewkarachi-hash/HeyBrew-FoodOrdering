const mongoose = require("mongoose");

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/heybrew");
  const r = await mongoose.connection.db.collection("storesettings").updateOne(
    { key: "default" },
    {
      $set: {
        banners: [
          {
            id: "dev-banner-1",
            title: "Your daily brew, delivered.",
            subtitle:
              "DEVELOPMENT_SEED — 2880x640 desktop + 900x450 mobile",
            imageUrl:
              "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=2880&h=640&fit=crop&q=80",
            imageUrlMobile:
              "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&h=450&fit=crop&q=80",
            isActive: true,
          },
        ],
      },
    }
  );
  console.log(r);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
