import { Order } from "../models/Order";
import { Product } from "../models/Product";
import { AdminUser } from "../models/AdminUser";

export async function getDashboardStats() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    ordersToday,
    pendingOrders,
    revenueAgg,
    productCount,
    staffCount,
  ] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: startOfDay } }),
    Order.countDocuments({
      status: { $in: ["pending", "confirmed", "preparing", "on_the_way", "ready_for_pickup"] },
    }),
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay },
          status: { $nin: ["cancelled"] },
        },
      },
      { $group: { _id: null, totalMinor: { $sum: "$totals.totalMinor" } } },
    ]),
    Product.countDocuments({ isArchived: false }),
    AdminUser.countDocuments({ isActive: true }),
  ]);

  return {
    ordersToday,
    pendingOrders,
    revenueTodayMinor: revenueAgg[0]?.totalMinor ?? 0,
    activeProducts: productCount,
    activeStaff: staffCount,
  };
}
