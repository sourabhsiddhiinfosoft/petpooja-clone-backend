import Order from "../models/Order.js";
import Table from "../models/Table.js";
import MenuItem from "../models/MenuItem.js";
import User from "../models/User.js";
import Customer from "../models/Customer.js";
import Staff from "../models/Staff.js";

// ✅ Owner Dashboard Summary
export const getOwnerDashboardSummary = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId; // owner is logged in

    // Today revenue
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayRevenue = await Order.aggregate([
      { $match: { restaurantId, createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);

    const totalOrders = await Order.countDocuments({ restaurantId });
    const activeTables = await Table.countDocuments({ restaurantId, status: "occupied" });
    const totalTables = await Table.countDocuments({ restaurantId });
    const pendingOrders = await Order.countDocuments({ restaurantId, status: "pending" });
    const menuItems = await MenuItem.countDocuments({ restaurantId });
    const staffMembers = await User.countDocuments({ restaurantId, role: "staff" });

    res.json({
      success: true,
      data: {
        todayRevenue: todayRevenue[0]?.total || 0,
        totalOrders,
        activeTables,
        totalTables,
        pendingOrders,
        menuItems,
        staffMembers
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Revenue (daily, weekly, monthly, yearly)
export const getOwnerRevenue = async (req, res) => {
  try {
    const { type, date, year } = req.query;
    const restaurantId = req.user.restaurantId;
    let pipeline = [{ $match: { restaurantId } }];

    if (type === "daily") {
      const targetDate = date ? new Date(date) : new Date();
      const start = new Date(targetDate.setHours(0, 0, 0, 0));
      const end = new Date(targetDate.setHours(23, 59, 59, 999));
      pipeline.push({ $match: { createdAt: { $gte: start, $lte: end } } });
      pipeline.push({ $group: { _id: null, total: { $sum: "$total" } } });
    }

    if (type === "weekly") {
      const start = new Date();
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      pipeline.push({ $match: { createdAt: { $gte: start, $lte: end } } });
      pipeline.push({
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          total: { $sum: "$total" }
        }
      });
    }

    if (type === "monthly") {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      pipeline.push({ $match: { createdAt: { $gte: start, $lte: end } } });
      pipeline.push({
        $group: {
          _id: { $dayOfMonth: "$createdAt" },
          total: { $sum: "$total" }
        }
      });
    }

    if (type === "yearly") {
      const y = year ? parseInt(year) : new Date().getFullYear();
      const start = new Date(y, 0, 1);
      const end = new Date(y, 11, 31);
      pipeline.push({ $match: { createdAt: { $gte: start, $lte: end } } });
      pipeline.push({
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: "$total" }
        }
      });
    }

    const revenue = await Order.aggregate(pipeline);
    res.json({ success: true, type, revenue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Customers (monthly, yearly)
export const getOwnerCustomerStats = async (req, res) => {
  try {
    const { type, year } = req.query;
    const restaurantId = req.user.restaurantId;
    let pipeline = [{ $match: { restaurantId } }];

    if (type === "monthly") {
      const y = year ? parseInt(year) : new Date().getFullYear();
      const start = new Date(y, 0, 1);
      const end = new Date(y, 11, 31);
      pipeline.push({ $match: { createdAt: { $gte: start, $lte: end } } });
      pipeline.push({
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      });
    }

    if (type === "yearly") {
      pipeline.push({
        $group: {
          _id: { $year: "$createdAt" },
          count: { $sum: 1 }
        }
      });
    }

    const stats = await Customer.aggregate(pipeline);
    res.json({ success: true, type, stats });
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



export const getOwnerDashboard = async (req, res) => {
  try {
    const restaurantId = req.user?.restaurantId || req.query.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: "restaurantId is required" });
    }

    // 1. Today's Revenue
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const todayRevenue = await Order.aggregate([
      { $match: { restaurantId, createdAt: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // 2. Total Orders
    const totalOrders = await Order.countDocuments({ restaurantId });

    // 3. Active Tables (occupied / total)
    const totalTables = await Table.countDocuments({ restaurantId });
    const activeTables = await Table.countDocuments({ restaurantId, status: "occupied" });

    // 4. Pending Orders
    const pendingOrders = await Order.countDocuments({ restaurantId, status: "pending" });

    // 5. Menu Items count
    const menuItems = await MenuItem.countDocuments({ restaurantId });

    // 6. Staff Members
    const staffMembers = await Staff.countDocuments({ restaurantId });

    // 7. Daily Revenue (last 7 days)
    const dailyRevenue = await Order.aggregate([
      { $match: { restaurantId } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, total: { $sum: "$amount" } } },
      { $sort: { _id: 1 } }
    ]);

    // 8. Total Customers (yearly chart)
    const totalCustomers = await Customer.countDocuments({ restaurantId });

    const yearlyCustomers = await Customer.aggregate([
      { $match: { restaurantId } },
      { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // 9. Recent Orders
    const recentOrders = await Order.find({ restaurantId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("customer","total");

      console.log(recentOrders);

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
      recentOrders: recentOrders.map(o => ({
        orderId: o._id,
        orderType: o.type,
        customer: o?.customer?.name || "Guest",
        amount: o.amount,
        total: o.total,
        type: o.type,
        status: o.status,
        createdAt: o.createdAt
      }))
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};