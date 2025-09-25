import express from "express";
import { salesReport, topItems } from "../controllers/reportController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/sales", requireRoles("owner","admin"), salesReport);
router.get("/top-items", requireRoles("owner","admin"), topItems);

export default router;
