import express from "express";
import {
  createRestaurant,
  getRestaurants,
  getRestaurant,
  updateRestaurant,
  deleteRestaurant
} from "../controllers/restaurantController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";

const router = express.Router();

router.use(requireAuth);
router.post("/", requireRoles("admin"), createRestaurant);
router.get("/", requireRoles("admin"), getRestaurants);
router.get("/:id", requireRoles("admin","owner"), getRestaurant);
router.put("/:id", requireRoles("admin"), updateRestaurant);
router.delete("/:id", requireRoles("admin"), deleteRestaurant);

export default router;
