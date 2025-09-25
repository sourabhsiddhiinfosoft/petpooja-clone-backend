import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import InventoryItem from "../models/InventoryItem.js";
import Table from "../models/Table.js";
import kotModel from "../models/kotModel.js";

const computeTotals = (items, taxRate = 0.05, discount = 0) => {
  const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const tax = +(subtotal * taxRate).toFixed(2);
  const total = +(subtotal + tax - discount).toFixed(2);
  return { subtotal, tax, discount, total };
};

const deductInventoryForOrder = async (order) => {
  for (const oi of order.items) {
    const menu = await MenuItem.findById(oi.menuItem).populate("ingredients.inventoryItem");
    if (!menu) continue;
    for (const ing of (menu.ingredients || [])) {
      const needed = (ing.qty || 0) * oi.qty;
      if (!ing.inventoryItem) continue;
      await InventoryItem.findByIdAndUpdate(ing.inventoryItem._id, { $inc: { quantity: -needed } });
    }
  }
};

export const placeOrder = async (req, res) => {
  try {
    const { type, tableNo, tableId, customer, items, discount = 0, taxRate = 0 } = req.body;
    const restaurantId = req.user.restaurantId || req.body.restaurantId;

    const itemDocs = await Promise.all(items.map(async (i) => {
      const m = await MenuItem.findById(i.menuItem);
      if (!m) throw new Error("Menu item not found");
      return { menuItem: m._id, name: m.name, qty: i.qty, price: m.price };
    }));

    const totals = computeTotals(itemDocs, taxRate, discount);
    const orderPayload = {
      restaurantId, type, tableNo, customer,
      items: itemDocs, ...totals, status: "pending"
    };
    if (tableId) orderPayload.tableId = tableId;

    const order = await Order.create(orderPayload);

    // auto generate KOT
    await kotModel.create({
      orderId: order._id,
      restaurantId,
      tableId,
      tableNo,
      items: itemDocs.map(i => ({ menuItem: i.menuItem, name: i.name, qty: i.qty }))
    });

    // If dine-in and table provided, mark table as occupied
    if (tableId && type === 'dine-in') {
      await Table.findByIdAndUpdate(tableId, { status: 'occupied' });
    }

    // Deduct inventory
    await deductInventoryForOrder(order);

    res.status(201).json(order);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.menuItem").populate("tableId");
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const listOrders = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId || req.query.restaurantId;
    const list = await Order.find({ restaurantId }).sort({ createdAt: -1 }).populate('tableId');
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const prev = await Order.findById(req.params.id);
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!order) return res.status(404).json({ error: "Order not found" });

    // If order finished or cancelled, free the table
    if (order.tableId && ['completed','cancelled'].includes(order.status)) {
      await Table.findByIdAndUpdate(order.tableId, { status: 'available' });
    }

    res.json(order);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

export const addPayment = async (req, res) => {
  try {
    const { method, amount, status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    order.payments.push({ method, amount, status });
    await order.save();
    res.json(order);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
