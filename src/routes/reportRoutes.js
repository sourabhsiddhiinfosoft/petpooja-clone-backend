import express from "express";
import {
  salesReport,
  topItemsReport,
  categoryReport,
  branchWiseReport
} from "../controllers/reportController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";

const router = express.Router();
router.use(requireAuth);

// Petpooja-style Reports Routes
router.get("/sales", requireRoles("owner", "admin"), salesReport); // daily sales trend
router.get("/top-items", requireRoles("owner", "admin"), topItemsReport); // top 10 items
router.get("/categories", requireRoles("owner", "admin"), categoryReport); // category summary
router.get("/branches", requireRoles("owner", "admin"), branchWiseReport); // branch summary

export default router;
