import Category from "../models/Category.js";

// Add Category
export const addCategory = async (req, res) => {
  try {
    const body = {
      ...req.body,
      restaurantId: req.user.restaurantId || req.body.restaurantId
    };
    const category = await Category.create(body);
    res.status(201).json(category);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Get all categories of a restaurant
export const getCategories = async (req, res) => {
  try {
    const restaurantId = req.params.restaurantId || req.user.restaurantId;
    const categories = await Category.find({ restaurantId, isActive: true });
    res.json(categories);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Update Category
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ error: "Not found" });
    res.json(category);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Delete Category
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Category deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
