import express from "express";
import { createArea, getAreasByRestaurant, getArea, updateArea, deleteArea } from "../controllers/areaController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", requireRoles("owner","admin"), createArea);
router.get("/restaurant/:restaurantId", requireRoles("owner","admin","staff"), getAreasByRestaurant);
router.get("/:id", requireRoles("owner","admin","staff"), getArea);
router.put("/:id", requireRoles("owner","admin"), updateArea);
router.delete("/:id", requireRoles("owner","admin"), deleteArea);

export default router;
