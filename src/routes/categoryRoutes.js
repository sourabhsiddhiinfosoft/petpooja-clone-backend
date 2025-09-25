import express from "express";
import { addCategory, getCategories, updateCategory, deleteCategory } from "../controllers/categoryController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";

const router = express.Router();

router.use(requireAuth);
router.post("/", requireRoles("owner","admin"), addCategory);
router.get("/:restaurantId?", requireRoles("owner","admin","staff"), getCategories);
router.put("/:id", requireRoles("owner","admin"), updateCategory);
router.delete("/:id", requireRoles("owner","admin"), deleteCategory);

export default router;
