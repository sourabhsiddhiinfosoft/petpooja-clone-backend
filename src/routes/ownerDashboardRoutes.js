import express from "express";
import { requireAuth, requireRoles } from "../middlewares/auth.js";
import {
  getOwnerDashboardSummary,
  getOwnerRevenue,
  getOwnerCustomerStats,
  getOwnerRecentOrders
} from "../controllers/ownerDashboardController.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRoles("owner")); // only restaurant owners

router.get("/summary", getOwnerDashboardSummary);
router.get("/revenue", getOwnerRevenue);
router.get("/customers", getOwnerCustomerStats);
router.get("/recent-orders", getOwnerRecentOrders);

export default router;
