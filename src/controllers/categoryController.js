import Category from "../models/Category.js";
import Branch from "../models/Branch.js";

// Add Category
export const addCategory = async (req, res) => {
  try {
    const { restaurantId, branchIds = [], type = "single", ...rest } = req.body;

    // Default restaurant from authenticated user if not provided
    const resolvedRestaurantId = req.user.restaurantId || restaurantId;

    let createdCategories = [];

    // Case 1: SINGLE (branchIds length = 1 or type === "single")
    if (type === "single" || (branchIds && branchIds.length === 1)) {
      const branchId = branchIds[0];
      const category = await Category.create({
        restaurantId: resolvedRestaurantId,
        branchId,
        ...rest,
      });
      createdCategories.push(category);
    }

    // Case 2: MULTIPLE (branchIds > 1 or type === "multiple")
    else if (type === "multiple" || (branchIds && branchIds.length > 1)) {
      createdCategories = await Promise.all(
        branchIds.map((branchId) =>
          Category.create({
            restaurantId: resolvedRestaurantId,
            branchId,
            ...rest,
          })
        )
      );
    }

    // Case 3: ALL branches of restaurant
    else if (type === "all") {
      const branches = await Branch.find({ restaurantId: resolvedRestaurantId });
      createdCategories = await Promise.all(
        branches.map((branch) =>
          Category.create({
            restaurantId: resolvedRestaurantId,
            branchId: branch._id,
            ...rest,
          })
        )
      );
    }

    return res.status(201).json({
      message: "Categories created successfully",
      categories: createdCategories,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Get Categories
export const getCategories = async (req, res) => {
  try {
    const restaurantId = req.params.restaurantId || req.user.restaurantId;
    const branchId = req.query.branchId; // optional

    const query = { restaurantId, isActive: true };
    if (branchId) query.branchId = branchId;

    const categories = await Category.find(query);
    res.json(categories);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Update Category
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
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



//Old codebefore impliment branch wise flow
// import Category from "../models/Category.js";

// // Add Category
// export const addCategory = async (req, res) => {
//   try {
//     const body = {
//       ...req.body,
//       restaurantId: req.user.restaurantId || req.body.restaurantId
//     };
//     const category = await Category.create(body);
//     res.status(201).json(category);
//   } catch (e) {
//     res.status(400).json({ error: e.message });
//   }
// };

// // Get all categories of a restaurant
// export const getCategories = async (req, res) => {
//   try {
//     const restaurantId = req.params.restaurantId || req.user.restaurantId;
//     const categories = await Category.find({ restaurantId, isActive: true });
//     res.json(categories);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };

// // Update Category
// export const updateCategory = async (req, res) => {
//   try {
//     const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!category) return res.status(404).json({ error: "Not found" });
//     res.json(category);
//   } catch (e) {
//     res.status(400).json({ error: e.message });
//   }
// };

// // Delete Category
// export const deleteCategory = async (req, res) => {
//   try {
//     const category = await Category.findByIdAndDelete(req.params.id);
//     if (!category) return res.status(404).json({ error: "Not found" });
//     res.json({ message: "Category deleted" });
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };
