
import kotModel from "../models/kotModel.js";
import Order from "../models/Order.js";

export const createKOT = async (req, res) => {
  try {
    const { orderId, items } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const kot = await kotModel.create({
      orderId,
      restaurantId: order.restaurantId,
      tableId: order.tableId,
      tableNo: order.tableNo,
      items
    });

    res.status(201).json(kot);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

export const listKOTs = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId || req.query.restaurantId;
    const list = await kotModel.find({ restaurantId }).populate("orderId tableId");
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const updateKOTStatus = async (req, res) => {
  try {
    const kot = await kotModel.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!kot) return res.status(404).json({ error: "KOT not found" });
    res.json(kot);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
