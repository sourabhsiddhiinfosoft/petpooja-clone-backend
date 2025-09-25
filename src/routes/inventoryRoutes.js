import express from "express";
import { addInventoryItem, getInventory, updateInventoryItem, deleteInventoryItem } from "../controllers/inventoryController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", requireRoles("owner","admin"), addInventoryItem);
router.get("/", requireRoles("owner","admin","staff"), getInventory);
router.put("/:id", requireRoles("owner","admin"), updateInventoryItem);
router.delete("/:id", requireRoles("owner","admin"), deleteInventoryItem);

export default router;
