import express from "express";
import {
  addMenuItem,
  getMenu,
  updateMenuItem,
  deleteMenuItem,
  updateMenuItemImage,
} from "../controllers/menuController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";
import { upload } from "../middlewares/upload.js";

const router = express.Router();

router.use(requireAuth);

// ✅ Create menu item with image
router.post("/", requireRoles("owner", "admin"), upload.single("image"), addMenuItem);

// ✅ Get menus (optionally by restaurantId)
router.get("/:restaurantId?", requireRoles("owner", "admin", "staff", "waiter"), getMenu);

// Existing endpoint for non-image updates (now expects JSON)
router.put("/:id", requireRoles("owner", "admin"), updateMenuItem);  // No Multer here
// New endpoint for image updates
router.put("/:id/image", requireRoles("owner", "admin"), upload.single("image"), updateMenuItemImage);


// ✅ Delete menu item
router.delete("/:id", requireRoles("owner", "admin"), deleteMenuItem);

export default router;




// import express from "express";
// import { addMenuItem, getMenu, updateMenuItem, deleteMenuItem } from "../controllers/menuController.js";
// import { requireAuth, requireRoles } from "../middlewares/auth.js";
// import { upload } from "../middlewares/upload.js";

// const router = express.Router();

// router.use(requireAuth);

// router.post("/", requireRoles("owner","admin"),upload.single("image"), addMenuItem);
// router.get("/:restaurantId?", requireRoles("owner","admin","staff","waiter"), getMenu);
// router.put("/:id", requireRoles("owner","admin"), updateMenuItem);
// router.delete("/:id", requireRoles("owner","admin"), deleteMenuItem);


// export default router;
