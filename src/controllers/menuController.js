import cloudinary from "../config/cloudinary.js";
import Branch from "../models/Branch.js";
import MenuItem from "../models/MenuItem.js";
import fs from "fs";
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

    // 🔹 Determine image URL (from Multer or Cloudinary)
    const imageUrl = req.file
      ? process.env.NODE_ENV === "production"
        ? req.file.path // Cloudinary auto returns URL in `path`
        : `/uploads/${req.file.filename}` // Local upload
      : null;

    if (imageUrl) menuFields.image = imageUrl;

    // Helper: ensure branch IDs belong to this restaurant
    const validateBranches = async (ids) => {
      const uniqueIds = [...new Set(ids)];
      const found = await Branch.find({
        _id: { $in: uniqueIds },
        restaurantId: resolvedRestaurantId,
      }).select("_id");
      return found.length === uniqueIds.length;
    };

    let createdItems = [];

    // 🟩 CASE: ALL branches
    if (type === "all") {
      const branches = await Branch.find({
        restaurantId: resolvedRestaurantId,
      }).select("_id");

      if (!branches.length)
        return res
          .status(404)
          .json({ error: "No branches found for this restaurant" });

      if (menuFields?.branchId) delete menuFields.branchId;

      createdItems = await Promise.all(
        branches.map((b) =>
          MenuItem.create({
            restaurantId: resolvedRestaurantId,
            branchId: b._id,
            type,
            ...menuFields,
          })
        )
      );
      return res
        .status(201)
        .json({ message: "Menu items created for all branches", items: createdItems });
    }

    // 🟨 CASE: MULTIPLE branches
    if (type === "multiple") {
      if (!Array.isArray(branchIds) || branchIds.length < 1) {
        return res
          .status(400)
          .json({ error: "branchIds array required for type 'multiple'" });
      }
      if (!(await validateBranches(branchIds))) {
        return res
          .status(400)
          .json({
            error: "One or more branchIds are invalid for this restaurant",
          });
      }

      const uniqueIds = [...new Set(branchIds)];
      if (menuFields?.branchId) delete menuFields.branchId;

      createdItems = await Promise.all(
        uniqueIds.map((bid) =>
          MenuItem.create({
            restaurantId: resolvedRestaurantId,
            branchId: bid,
            type,
            ...menuFields,
          })
        )
      );

      return res
        .status(201)
        .json({
          message: "Menu items created for multiple branches",
          items: createdItems,
        });
    }

    // 🟦 CASE: SINGLE (default)
    const singleBranchId =
      (Array.isArray(branchIds) && branchIds[0]) || menuFields.branchId;
    if (!singleBranchId) {
      return res
        .status(400)
        .json({ error: "branchId required for single menu creation" });
    }

    const branchOk = await Branch.findOne({
      _id: singleBranchId,
      restaurantId: resolvedRestaurantId,
    }).select("_id");

    if (!branchOk) {
      return res
        .status(400)
        .json({ error: "branch not found or doesn't belong to this restaurant" });
    }

    const item = await MenuItem.create({
      restaurantId: resolvedRestaurantId,
      branchId: singleBranchId,
      type,
      ...menuFields,
    });

    return res.status(201).json(item);
  } catch (e) {
    console.error("addMenuItem error:", e);
    return res.status(400).json({ error: e.message });
  }
};


//Add menu item without image upload
// export const addMenuItem = async (req, res) => {
//   try {
//     const {
//       restaurantId: bodyRestaurantId,
//       branchIds = [],
//       type = "single",
//       ...menuFields
//     } = req.body;


//     const resolvedRestaurantId = req.user?.restaurantId || bodyRestaurantId;
//     if (!resolvedRestaurantId) {
//       return res.status(400).json({ error: "restaurantId is required" });
//     }

//     // Helper: ensure branch IDs belong to this restaurant
//     const validateBranches = async (ids) => {
//       const uniqueIds = [...new Set(ids)];
//       const found = await Branch.find({
//         _id: { $in: uniqueIds },
//         restaurantId: resolvedRestaurantId
//       }).select("_id");
//       if (found.length !== uniqueIds.length) {
//         return false;
//       }
//       return true;
//     };

// let createdItems = [];

//         // CASE: ALL branches
//     if (type === "all") {
//       const branches = await Branch.find({ restaurantId: resolvedRestaurantId }).select("_id");
//       if (!branches.length) {
//         return res.status(404).json({ error: "No branches found for this restaurant" });
//       }

//       if(menuFields?.branchId) delete menuFields?.branchId
      
//       createdItems = await Promise.all(
//         branches.map((b) =>
//           MenuItem.create({
//             restaurantId: resolvedRestaurantId,
//             branchId: b._id,
//             type,
//             ...menuFields
//           })
//         )
//       );
//       return res.status(201).json({ message: "Menu items created for all branches", items: createdItems });
//     }

    
//     // CASE: MULTIPLE branches
//     if (type === "multiple") {
//       if (!Array.isArray(branchIds) || branchIds.length < 1) {
//         return res.status(400).json({ error: "branchIds array required for type 'multiple'" });
//       }
//       if (!(await validateBranches(branchIds))) {
//         return res.status(400).json({ error: "One or more branchIds are invalid for this restaurant" });
//       }

//       const uniqueIds = [...new Set(branchIds)];
//       if(menuFields?.branchId) delete menuFields?.branchId
      
//       createdItems = await Promise.all(
//         uniqueIds.map((bid) =>{
//           return MenuItem.create({
//             restaurantId: resolvedRestaurantId,
//             branchId: bid,
//             type,
//             ...menuFields
//           })
//         }
//         )
//       );

//       return res.status(201).json({ message: "Menu items created for multiple branches", items: createdItems });
//     }

   
//     // CASE: SINGLE (default)
//     const singleBranchId = (Array.isArray(branchIds) && branchIds[0]) || menuFields.branchId;
//     if (!singleBranchId) {
//       return res.status(400).json({ error: "branchId required for single menu creation" });
//     }

//     const branchOk = await Branch.findOne({
//       _id: singleBranchId,
//       restaurantId: resolvedRestaurantId,
//     }).select("_id");

//     if (!branchOk) {
//       return res.status(400).json({ error: "branch not found or doesn't belong to this restaurant" });
//     }

//     const item = await MenuItem.create({
//       restaurantId: resolvedRestaurantId,
//       branchId: singleBranchId,
//       type,
//       ...menuFields
//     });
//     return res.status(201).json(item);
//   } catch (e) {
//     console.error("addMenuItem error:", e);
//     return res.status(400).json({ error: e.message });
//   }
// };


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
    const filter = { restaurantId };
    if (categoryId) filter.categoryId = categoryId;
    if (branchId) filter.branchId = branchId;

    const items = await MenuItem.find(filter).populate("categoryId", "name");
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


export const updateMenuItem = async (req, res) => {
  try {
    const menuId = req.params.id;
    const updateData = { ...req.body };  // Expect JSON body with fields like name, price, etc.
    // Protect restricted fields
    delete updateData._id;
    delete updateData.restaurantId;
    delete updateData.image;  // Don't allow image updates here
    const item = await MenuItem.findByIdAndUpdate(
      menuId,
      updateData,
      { new: true, runValidators: true }
    );
    if (!item) {
      return res.status(400).json({ error: "Menu item not found" });
    }
    res.status(200).json({
      message: "Menu item updated successfully",
      item,
    });
  } catch (error) {
    console.error("updateMenuItem error:", error);
    res.status(400).json({ error: error.message });
  }
};



export const updateMenuItemImage = async (req, res) => {
  try {
    const menuId = req.params.id;
    
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided." });
    }

    let imageUrl = null;
    if (fs.existsSync(req.file.path)) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "menu_items",
        transformation: [{ width: 500, height: 500, crop: "limit" }],
      });
      imageUrl = result.secure_url;
      
      // Optionally delete the old image from Cloudinary
      const item = await MenuItem.findById(menuId);
      if (item?.image && item.image.includes("cloudinary.com")) {
        const publicId = item.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`menu_items/${publicId}`).catch(err => console.error("Cloudinary delete error:", err));
      }
    } else {
      return res.status(400).json({ error: "Uploaded file not found." });
    }

    const updatedItem = await MenuItem.findByIdAndUpdate(
      menuId,
      { image: imageUrl },  // Only update the image field
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    res.status(200).json({
      message: "Menu item image updated successfully",
      item: updatedItem,
    });
  } catch (error) {
    console.error("updateMenuItemImage error:", error);
    res.status(400).json({ error: error.message });
  }
};


// // Update Menu Item
// export const updateMenuItem = async (req, res) => {
//   try {
//     const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!item) return res.status(404).json({ error: "Not found" });
//     res.json(item);
//   } catch (e) {
//     res.status(400).json({ error: e.message });
//   }
// };

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
