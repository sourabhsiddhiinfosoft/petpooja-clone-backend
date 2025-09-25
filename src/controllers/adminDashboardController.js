import Restaurant from "../models/Restaurant.js";
import Order from "../models/Order.js";
import Customer from "../models/Customer.js";
import User from "../models/User.js";

// ✅ Dashboard Summary
export const getDashboardSummary = async (req, res) => {
  try {
    const activeRestaurantsCount = await Restaurant.countDocuments({ isActive: true });
     const ownersCount = await User.countDocuments({ role: "owner" });

    // current month revenue
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthlyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);

    const recentRestaurants = await Restaurant.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      data: {
        activeRestaurantsCount,
        ownersCount,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        recentRestaurants
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Revenue (daily, weekly, monthly, yearly)
export const getRevenue = async (req, res) => {
  try {
    const { type, date, year } = req.query;
    let pipeline = [];

    if (type === "daily") {
      const targetDate = date ? new Date(date) : new Date();
      const start = new Date(targetDate.setHours(0, 0, 0, 0));
      const end = new Date(targetDate.setHours(23, 59, 59, 999));
      pipeline = [
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ];
    }

    if (type === "weekly") {
      const start = new Date();
      start.setDate(start.getDate() - start.getDay()); // start of week
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      pipeline = [
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dayOfWeek: "$createdAt" },
            total: { $sum: "$total" }
          }
        }
      ];
    }

    if (type === "monthly") {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      pipeline = [
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dayOfMonth: "$createdAt" },
            total: { $sum: "$total" }
          }
        }
      ];
    }

    if (type === "yearly") {
      const y = year ? parseInt(year) : new Date().getFullYear();
      const start = new Date(y, 0, 1);
      const end = new Date(y, 11, 31);
      pipeline = [
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $month: "$createdAt" },
            total: { $sum: "$total" }
          }
        }
      ];
    }

    const revenue = await Order.aggregate(pipeline);
    res.json({ success: true, type, revenue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Customers (monthly, yearly)
export const getCustomerStats = async (req, res) => {
  try {
    const { type, year } = req.query;
    let pipeline = [];

    if (type === "monthly") {
      const y = year ? parseInt(year) : new Date().getFullYear();
      const start = new Date(y, 0, 1);
      const end = new Date(y, 11, 31);
      pipeline = [
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $month: "$createdAt" },
            count: { $sum: 1 }
          }
        }
      ];
    }

    if (type === "yearly") {
      pipeline = [
        {
          $group: {
            _id: { $year: "$createdAt" },
            count: { $sum: 1 }
          }
        }
      ];
    }

    const stats = await Customer.aggregate(pipeline);
    res.json({ success: true, type, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
