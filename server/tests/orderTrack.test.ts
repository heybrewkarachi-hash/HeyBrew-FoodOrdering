import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../src/app";
import { Branch } from "../src/models/Branch";
import { Category } from "../src/models/Category";
import { Product } from "../src/models/Product";
import { StoreSettings } from "../src/models/StoreSettings";
import { createOrder, trackOrder } from "../src/services/orderService";
import { AppError } from "../src/utils/errors";
import { memoryStore } from "../src/utils/memoryStore";

let mongo: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
  memoryStore.clear();
});

async function seedCatalog() {
  const branch = await Branch.create({
    name: "Test Branch",
    slug: "test-branch",
    address: { line1: "1 Test St", area: "Clifton", city: "Karachi" },
    isPickupOpen: true,
    hours: {},
    orderingPaused: false,
    isActive: true,
  });
  const category = await Category.create({
    name: "Hot Brew",
    slug: "hot-brew",
    displayOrder: 1,
    isActive: true,
  });
  const product = await Product.create({
    name: "Cappuccino",
    slug: "cappuccino",
    description: "test",
    categoryId: category._id,
    priceMinor: 50000,
    availableBranchIds: [branch._id],
    soldOutBranchIds: [],
    featured: true,
    isArchived: false,
  });
  await StoreSettings.create({ key: "default", taxEnabled: false });
  return { branch, product };
}

describe("order track authorization", () => {
  it("rejects track without token", async () => {
    const { branch, product } = await seedCatalog();
    const created = await createOrder(
      {
        type: "pickup",
        branchId: String(branch._id),
        items: [{ productId: String(product._id), quantity: 1, modifiers: [] }],
        paymentMethod: "cod",
        customer: { name: "Ali Test", phone: "+923001234567" },
      },
      "idem-track-1-abcdefgh"
    );

    await expect(trackOrder(created.orderNumber, undefined)).rejects.toBeInstanceOf(
      AppError
    );

    const res = await request(app).get(
      `/api/v1/orders/track/${created.orderNumber}`
    );
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("TRACK_TOKEN_REQUIRED");
  });

  it("rejects track with wrong token", async () => {
    const { branch, product } = await seedCatalog();
    const created = await createOrder(
      {
        type: "pickup",
        branchId: String(branch._id),
        items: [{ productId: String(product._id), quantity: 1, modifiers: [] }],
        paymentMethod: "cod",
        customer: { name: "Ali Test", phone: "+923001234567" },
      },
      "idem-track-2-abcdefgh"
    );

    const res = await request(app).get(
      `/api/v1/orders/track/${created.orderNumber}?token=wrong-token-value`
    );
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("TRACK_FORBIDDEN");
  });

  it("allows track with valid access token", async () => {
    const { branch, product } = await seedCatalog();
    const created = await createOrder(
      {
        type: "pickup",
        branchId: String(branch._id),
        items: [{ productId: String(product._id), quantity: 1, modifiers: [] }],
        paymentMethod: "cod",
        customer: { name: "Ali Test", phone: "+923001234567" },
      },
      "idem-track-3-abcdefgh"
    );

    const res = await request(app).get(
      `/api/v1/orders/track/${created.orderNumber}?token=${created.accessToken}`
    );
    expect(res.status).toBe(200);
    expect(res.body.order.orderNumber).toBe(created.orderNumber);
    expect(res.body.order.status).toBe("pending");
  });

  it("never grants history by phone alone (no phone track endpoint)", async () => {
    const res = await request(app)
      .get("/api/v1/orders/by-phone/03001234567")
      .expect(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
