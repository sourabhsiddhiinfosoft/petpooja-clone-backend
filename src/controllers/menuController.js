import Branch from "../models/Branch.js";
import MenuItem from "../models/MenuItem.js";

// Add Menu Item
/**
 * Add Menu Item
 * Body expects:
 *  - restaurantId? (optional, fallback to req.user.restaurantId)
 *  - type: "single" | "multiple" | "all"   (default "single")
 *  - branchIds: []    (required for single/multiple as appropriate)
 *  - ...menu item fields (categoryId, name, price, etc)
 */
export const addMenuItem = async (req, res) => {
  try {
    const {
      restaurantId: bodyRestaurantId,
      branchIds = [],
      type = "single",
      ...menuFields
    } = req.body;


    const resolvedRestaurantId = req.user?.restaurantId || bodyRestaurantId;
    if (!resolvedRestaurantId) {
      return res.status(400).json({ error: "restaurantId is required" });
    }

    // Helper: ensure branch IDs belong to this restaurant
    const validateBranches = async (ids) => {
      const uniqueIds = [...new Set(ids)];
      const found = await Branch.find({
        _id: { $in: uniqueIds },
        restaurantId: resolvedRestaurantId
      }).select("_id");
      if (found.length !== uniqueIds.length) {
        return false;
      }
      return true;
    };

let createdItems = [];

        // CASE: ALL branches
    if (type === "all") {
      const branches = await Branch.find({ restaurantId: resolvedRestaurantId }).select("_id");
      if (!branches.length) {
        return res.status(404).json({ error: "No branches found for this restaurant" });
      }

      if(menuFields?.branchId) delete menuFields?.branchId
      
      createdItems = await Promise.all(
        branches.map((b) =>
          MenuItem.create({
            restaurantId: resolvedRestaurantId,
            branchId: b._id,
            type,
            ...menuFields
          })
        )
      );
      return res.status(201).json({ message: "Menu items created for all branches", items: createdItems });
    }

    
    // CASE: MULTIPLE branches
    if (type === "multiple") {
      if (!Array.isArray(branchIds) || branchIds.length < 1) {
        return res.status(400).json({ error: "branchIds array required for type 'multiple'" });
      }
      if (!(await validateBranches(branchIds))) {
        return res.status(400).json({ error: "One or more branchIds are invalid for this restaurant" });
      }

      const uniqueIds = [...new Set(branchIds)];
      if(menuFields?.branchId) delete menuFields?.branchId
      
      createdItems = await Promise.all(
        uniqueIds.map((bid) =>{
          return MenuItem.create({
            restaurantId: resolvedRestaurantId,
            branchId: bid,
            type,
            ...menuFields
          })
        }
        )
      );

      return res.status(201).json({ message: "Menu items created for multiple branches", items: createdItems });
    }

   
    // CASE: SINGLE (default)
    const singleBranchId = (Array.isArray(branchIds) && branchIds[0]) || menuFields.branchId;
    if (!singleBranchId) {
      return res.status(400).json({ error: "branchId required for single menu creation" });
    }

    const branchOk = await Branch.findOne({
      _id: singleBranchId,
      restaurantId: resolvedRestaurantId,
    }).select("_id");

    if (!branchOk) {
      return res.status(400).json({ error: "branch not found or doesn't belong to this restaurant" });
    }

    const item = await MenuItem.create({
      restaurantId: resolvedRestaurantId,
      branchId: singleBranchId,
      type,
      ...menuFields
    });
    return res.status(201).json(item);
  } catch (e) {
    console.error("addMenuItem error:", e);
    return res.status(400).json({ error: e.message });
  }
};


// Get Menu Items (optional filter by category)
// export const getMenu = async (req, res) => {
//   try {
//     const restaurantId = req.params.restaurantId || req.user.restaurantId;
//     const { categoryId } = req.query;

//     const filter = { restaurantId };
//     if (categoryId) filter.categoryId = categoryId;
//     const items = await MenuItem.find(filter).populate("categoryId", "name");
//     res.json(items);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };

//update with branch flow
export const getMenu = async (req, res) => {
  try {
    const restaurantId = req.params.restaurantId || req.user.restaurantId;
    const { categoryId, branchId } = req.query;
console.log("branchId:", branchId);
    const filter = { restaurantId };
    if (categoryId) filter.categoryId = categoryId;
    if (branchId) filter.branchId = branchId;

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
