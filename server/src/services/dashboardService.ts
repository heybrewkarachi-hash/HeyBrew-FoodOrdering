import { Order } from "../models/Order";
import { serializeAdminOrder } from "./orderService";

const ACTIVE_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "on_the_way",
  "ready_for_pickup",
] as const;

const COMPLETED_STATUSES = ["delivered", "collected"] as const;

export async function getDashboardStats(params: {
  from: Date;
  to: Date;
  branchId?: string;
}) {
  const range: Record<string, unknown> = {
    createdAt: { $gte: params.from, $lte: params.to },
  };
  if (params.branchId) {
    range.branchId = params.branchId;
  }

  const salesNote =
    "Sales include delivered & collected orders only. Cancelled orders are excluded.";

  const [
    newOrders,
    activeOrders,
    completedOrders,
    cancelledOrders,
    salesAgg,
    popularAgg,
    recent,
  ] = await Promise.all([
    Order.countDocuments({ ...range, status: "pending" }),
    Order.countDocuments({ ...range, status: { $in: [...ACTIVE_STATUSES] } }),
    Order.countDocuments({ ...range, status: { $in: [...COMPLETED_STATUSES] } }),
    Order.countDocuments({ ...range, status: "cancelled" }),
    Order.aggregate([
      {
        $match: {
          ...range,
          status: { $in: [...COMPLETED_STATUSES] },
        },
      },
      {
        $group: {
          _id: null,
          salesMinor: { $sum: "$totals.totalMinor" },
          count: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      {
        $match: {
          ...range,
          status: { $in: [...COMPLETED_STATUSES] },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.productName" },
          quantity: { $sum: "$items.quantity" },
          revenueMinor: { $sum: "$items.lineTotalMinor" },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 8 },
    ]),
    Order.find(range).sort({ createdAt: -1 }).limit(12),
  ]);

  const salesMinor = salesAgg[0]?.salesMinor ?? 0;
  const completedCount = salesAgg[0]?.count ?? 0;

  return {
    newOrders,
    activeOrders,
    completedOrders,
    cancelledOrders,
    salesMinor,
    salesNote,
    aovMinor: completedCount > 0 ? Math.round(salesMinor / completedCount) : 0,
    popularProducts: popularAgg.map((p) => ({
      productId: String(p._id),
      name: p.name as string,
      quantity: p.quantity as number,
      revenueMinor: p.revenueMinor as number,
    })),
    recentOrders: recent.map(serializeAdminOrder),
    from: params.from.toISOString(),
    to: params.to.toISOString(),
    branchId: params.branchId ?? null,
  };
}
