import InventoryItem from "../models/InventoryItem.js";

export const addInventoryItem = async (req, res) => {
  try {
    const body = { ...req.body, restaurantId: req.user.restaurantId || req.body.restaurantId };
    const item = await InventoryItem.create(body);
    res.status(201).json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

export const getInventory = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId || req.query.restaurantId;
    const items = await InventoryItem.find({ restaurantId });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const updateInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

export const deleteInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Inventory item deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
