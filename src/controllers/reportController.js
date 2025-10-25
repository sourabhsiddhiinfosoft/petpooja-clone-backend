import mongoose from "mongoose";
import Order from "../models/Order.js";

/**
 * SALES REPORT (Daily / Branch-wise)
 * Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD&branchId=xxx
 */
export const salesReport = async (req, res) => {
  try {
    const { from, to, branchId } = req.query;
    const restaurantId = req.user.restaurantId || req.query.restaurantId;

 const match = { restaurantId: new mongoose.Types.ObjectId(restaurantId) };

    // ✅ FIX: Convert branchId to ObjectId if valid and not "all"
    if (branchId && branchId !== "all") {
      if (mongoose.Types.ObjectId.isValid(branchId)) {
        match.branchId = new mongoose.Types.ObjectId(branchId);
      } else {
        return res.status(400).json({ error: "Invalid branchId format" });
      }
    }
    if (from || to) match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);

    console.log("Sales Report Match:", match);

    const agg = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            branchId: "$branchId",
          },
          orders: { $sum: 1 },
          revenue: { $sum: "$total" },
        },
      },
      { $sort: { "_id.day": 1 } },
    ]);

    const formatted = agg.map((r) => ({
      date: r._id.day,
      branchId: r._id.branchId,
      orders: r.orders,
      revenue: r.revenue,
    }));

    res.json(formatted);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/**
 * TOP ITEMS REPORT
 * Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD&branchId=xxx
 */
export const topItemsReport = async (req, res) => {
  try {
    const { from, to, branchId } = req.query;
    const restaurantId = req.user.restaurantId || req.query.restaurantId;

    const match = { restaurantId };
    if (branchId && branchId !== "all") match.branchId = branchId;
    if (from || to) match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);

    const agg = await Order.aggregate([
      { $match: match },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          qty: { $sum: "$items.qty" },
          revenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } },
        },
      },
      { $sort: { qty: -1 } },
      { $limit: 10 },
    ]);

    res.json(agg);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/**
 * CATEGORY-WISE REPORT
 * Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD&branchId=xxx
 */
export const categoryReport = async (req, res) => {
  try {
    const { from, to, branchId } = req.query;
    const restaurantId = req.user.restaurantId || req.query.restaurantId;

    const match = { restaurantId };
    if (branchId && branchId !== "all") match.branchId = branchId;
    if (from || to) match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);

    const agg = await Order.aggregate([
      { $match: match },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.categoryName",
          totalQty: { $sum: "$items.qty" },
          totalRevenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    res.json(agg);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/**
 * BRANCH-WISE SUMMARY
 * Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
export const branchWiseReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const restaurantId = req.user.restaurantId || req.query.restaurantId;

    const match = { restaurantId };
    if (from || to) match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);

    const agg = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$branchId",
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$total" },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    res.json(agg);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
