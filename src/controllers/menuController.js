import MenuItem from "../models/MenuItem.js";

// Add Menu Item
export const addMenuItem = async (req, res) => {
  try {
    const body = {
      ...req.body,
      restaurantId: req.user.restaurantId || req.body.restaurantId
    };

    const item = await MenuItem.create(body);
    res.status(201).json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Get Menu Items (optional filter by category)
export const getMenu = async (req, res) => {
  try {
    const restaurantId = req.params.restaurantId || req.user.restaurantId;
    const { categoryId } = req.query;

    const filter = { restaurantId };
    if (categoryId) filter.categoryId = categoryId;
    const items = await MenuItem.find(filter).populate("categoryId", "name");
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Update Menu Item
export const updateMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Delete Menu Item
export const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Menu item deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};



// import MenuItem from "../models/MenuItem.js";

// export const addMenuItem = async (req, res) => {
//   try {
//     const body = { ...req.body, restaurantId: req.user.restaurantId || req.body.restaurantId };
//     const item = await MenuItem.create(body);
//     res.status(201).json(item);
//   } catch (e) {
//     res.status(400).json({ error: e.message });
//   }
// };

// export const getMenu = async (req, res) => {
//   try {
//     const restaurantId = req.params.restaurantId || req.user.restaurantId;
//     const items = await MenuItem.find({ restaurantId });
//     res.json(items);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };

// export const updateMenuItem = async (req, res) => {
//   try {
//     const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!item) return res.status(404).json({ error: "Not found" });
//     res.json(item);
//   } catch (e) {
//     res.status(400).json({ error: e.message });
//   }
// };

// export const deleteMenuItem = async (req, res) => {
//   try {
//     const item = await MenuItem.findByIdAndDelete(req.params.id);
//     if (!item) return res.status(404).json({ error: "Not found" });
//     res.json({ message: "Menu item deleted" });
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };
