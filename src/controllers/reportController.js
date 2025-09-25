import Order from "../models/Order.js";

export const salesReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const restaurantId = req.user.restaurantId || req.query.restaurantId;
    const match = { restaurantId };
    if (from || to) match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);

    const agg = await Order.aggregate([
      { $match: match },
      { $group: {
          _id: { day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }}},
          orders: { $sum: 1 },
          revenue: { $sum: "$total" }
      }},
      { $sort: {"_id.day": 1}}
    ]);
    res.json(agg);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const topItems = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId || req.query.restaurantId;
    const agg = await Order.aggregate([
      { $match: { restaurantId } },
      { $unwind: "$items" },
      { $group: { _id: "$items.name", qty: { $sum: "$items.qty" }, revenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } } } },
      { $sort: { qty: -1 } },
      { $limit: 10 }
    ]);
    res.json(agg);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
