import Table from "../models/Table.js";
import Area from "../models/Area.js";

export const createTable = async (req, res) => {
  try {
    const body = { ...req.body, restaurantId: req.user.restaurantId || req.body.restaurantId };
    // if area provided, ensure it belongs to same restaurant (optional check)
    if (body.area) {
      const area = await Area.findById(body.area);
      if (!area) return res.status(400).json({ error: "Area not found" });
      if (String(area.restaurantId) !== String(body.restaurantId || req.user.restaurantId)) {
        return res.status(400).json({ error: "Area does not belong to the restaurant" });
      }
    }
    const table = await Table.create(body);
    res.status(201).json(table);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

export const getTablesByRestaurant = async (req, res) => {
  try {
    const restaurantId = req.params.restaurantId || req.user.restaurantId || req.query.restaurantId;
    if (!restaurantId) return res.status(400).json({ error: "restaurantId required" });
    const tables = await Table.find({ restaurantId }).populate("area").sort({ name: 1 });
    res.json(tables);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const getTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id).populate("area");
    if (!table) return res.status(404).json({ error: "Table not found" });
    res.json(table);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const updateTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!table) return res.status(404).json({ error: "Table not found" });
    res.json(table);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

export const deleteTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) return res.status(404).json({ error: "Table not found" });
    res.json({ message: "Table deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const updateTableStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["available","occupied","reserved","out-of-service"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const table = await Table.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!table) return res.status(404).json({ error: "Table not found" });
    res.json(table);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
