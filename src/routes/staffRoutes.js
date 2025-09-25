import express from "express";
import { addStaff, listStaff, updateStaff, deleteStaff } from "../controllers/staffController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";

const router = express.Router();
router.use(requireAuth);

// Only owner & admin can manage staff
router.post("/", requireRoles("owner", "admin"), addStaff);
router.get("/", requireRoles("owner", "admin"), listStaff);
router.put("/:id", requireRoles("owner", "admin"), updateStaff);
router.delete("/:id", requireRoles("owner", "admin"), deleteStaff);

export default router;
