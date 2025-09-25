import express from "express";
import { requireAuth, requireRoles } from "../middlewares/auth.js";
import {
  getDashboardSummary,
  getRevenue,
  getCustomerStats
} from "../controllers/adminDashboardController.js";

const router = express.Router();

router.use(requireAuth);

router.get("/summary",requireRoles("admin"), getDashboardSummary); // Dashboard Summary

router.get("/revenue",requireRoles("admin"), getRevenue); // Revenue API

router.get("/customers",requireRoles("admin"), getCustomerStats); // Customers API

export default router;
