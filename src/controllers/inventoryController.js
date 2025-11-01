import InventoryItem from "../models/InventoryItem.js";

export const addInventoryItem = async (req, res) => {
  try {
    const body = {
      ...req.body,
      restaurantId: req.user?.restaurantId || req.body.restaurantId,
      branchId: req.user?.branchId || req.body.branchId,
    };
    // Remove any fields not in the schema if needed, but with the updated model, all should be fine.
    const item = await InventoryItem.create(body);
    res.status(201).json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

export const getInventory = async (req, res) => {
  try {
    const restaurantId = req.user?.restaurantId || req.query.restaurantId;
    const branchId = req.user?.branchId || req.query.branchId;

    if (!branchId) {
      return res.status(400).json({ error: "branchId is required" });
    }

    const items = await InventoryItem.find({ restaurantId, branchId });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// In updateInventoryItem, ensure it updates all fields:
export const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const branchId = req.user?.branchId || req.body.branchId;
    const item = await InventoryItem.findOneAndUpdate(
      { _id: id, branchId },
      req.body,  // This will now update all fields
      { new: true }
    );
    if (!item) return res.status(404).json({ error: "Not found or unauthorized" });
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};


export const deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const branchId = req.user?.branchId || req.query.branchId;

    const item = await InventoryItem.findOneAndDelete({ _id: id, branchId });
    if (!item) return res.status(404).json({ error: "Not found or unauthorized" });

    res.json({ message: "Inventory item deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
