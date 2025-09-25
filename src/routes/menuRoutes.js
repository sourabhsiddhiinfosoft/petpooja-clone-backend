import express from "express";
import { addMenuItem, getMenu, updateMenuItem, deleteMenuItem } from "../controllers/menuController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";

const router = express.Router();

router.use(requireAuth);
router.post("/", requireRoles("owner","admin"), addMenuItem);
router.get("/:restaurantId?", requireRoles("owner","admin","staff"), getMenu);
router.put("/:id", requireRoles("owner","admin"), updateMenuItem);
router.delete("/:id", requireRoles("owner","admin"), deleteMenuItem);

export default router;
