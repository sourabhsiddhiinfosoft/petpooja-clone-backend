// routes/ownerDashboardRoutes.js
import express from "express";
import {
  getOwnerDashboard,
  getOwnerRevenue,
  getOwnerCustomerStats,
  getOwnerRecentOrders,
} from "../controllers/ownerDashboardController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRoles("owner"));

// Main dashboard
router.get("/", getOwnerDashboard);
router.get("/revenue", getOwnerRevenue);
router.get("/customers", getOwnerCustomerStats);
router.get("/recent-orders", getOwnerRecentOrders);

export default router;
