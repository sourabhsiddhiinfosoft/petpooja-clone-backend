// controllers/ownerDashboardController.js
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Table from "../models/Table.js";
import MenuItem from "../models/MenuItem.js";
import Customer from "../models/Customer.js";
import Staff from "../models/Staff.js";

// ✅ Owner Dashboard Summary (Cards + Recent Orders + Basic Stats)
export const getOwnerDashboard = async (req, res) => {
  try {
    const restaurantId = req.user?.restaurantId || req.query.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: "restaurantId is required" });
    }

    // Today's Revenue
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayRevenue = await Order.aggregate([
      { $match: { restaurantId, createdAt: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    // Basic Metrics
    const [totalOrders, totalTables, activeTables, pendingOrders, menuItems, staffMembers] =
      await Promise.all([
        Order.countDocuments({ restaurantId }),
        Table.countDocuments({ restaurantId }),
        Table.countDocuments({ restaurantId, status: "occupied" }),
        Order.countDocuments({ restaurantId, status: "pending" }),
        MenuItem.countDocuments({ restaurantId }),
        Staff.countDocuments({ restaurantId }),
      ]);

    // Daily Revenue (default last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const dailyRevenue = await Order.aggregate([
      { $match: { restaurantId, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Customers (Yearly by default)
    const totalCustomers = await Customer.countDocuments({ restaurantId });
    const yearlyCustomers = await Customer.aggregate([
      { $match: { restaurantId } },
      { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Recent Orders
    const recentOrders = await Order.find({ restaurantId })
      .populate("customer", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      todayRevenue: todayRevenue[0]?.total || 0,
      totalOrders,
      activeTables: `${activeTables}/${totalTables}`,
      pendingOrders,
      menuItems,
      staffMembers,
      dailyRevenue,
      totalCustomers,
      yearlyCustomers,
      recentOrders: recentOrders.map((o) => ({
        orderId: o._id,
        orderType: o.orderType,
        customer: o.customer?.name || "Guest",
        total: o.total,
        status: o.status,
        createdAt: o.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//
// ✅ Revenue Chart Data
//
export const getOwnerRevenue = async (req, res) => {
  try {
    const restaurantId = req.user?.restaurantId;
    const { period = "weekly", year } = req.query;

    const now = new Date();
    let start, end, groupFormat;

    // ✅ Handle all periods properly
    if (period === "daily") {
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date(now.setHours(23, 59, 59, 999));
      groupFormat = "%Y-%m-%d %H:00"; // hourly breakdown
    } else if (period === "weekly") {
      start = new Date();
      start.setDate(start.getDate() - 6);
      end = new Date();
      groupFormat = "%Y-%m-%d";
    } else if (period === "monthly") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      groupFormat = "%Y-%m-%d";
    } else if (period === "yearly") {
      const y = year ? parseInt(year) : now.getFullYear();
      start = new Date(y, 0, 1);
      end = new Date(y, 11, 31);
      groupFormat = "%Y-%m";
    }

    // ✅ Only completed orders
    const revenue = await Order.aggregate([
      {
        $match: {
          restaurantId,
          status: "completed",
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
          total: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, period, revenue });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};


//
// ✅ Customer Chart Data
//
export const getOwnerCustomerStats = async (req, res) => {
  try {
    const restaurantId = req.user?.restaurantId;
    const { period = "yearly", year } = req.query;

    let pipeline = [{ $match: { restaurantId } }];

    if (period === "monthly") {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      pipeline.push({ $match: { createdAt: { $gte: start, $lte: end } } });
      pipeline.push({
        $group: {
          _id: { $dayOfMonth: "$createdAt" },
          count: { $sum: 1 },
        },
      });
    } else {
      const y = year ? parseInt(year) : new Date().getFullYear();
      const start = new Date(y, 0, 1);
      const end = new Date(y, 11, 31);
      pipeline.push({ $match: { createdAt: { $gte: start, $lte: end } } });
      pipeline.push({
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      });
    }

    pipeline.push({ $sort: { _id: 1 } });

    const stats = await Customer.aggregate(pipeline);
    res.json({ success: true, period, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// ✅ Recent Orders
export const getOwnerRecentOrders = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const orders = await Order.find({ restaurantId })
      .populate("customer", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      orders: orders.map(o => ({
        orderId: o.orderCode || o._id,
        orderType: o.orderType,
        customer: o.customer?.name || "Guest",
        amount: o.total,
        status: o.status,
        dateTime: o.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


