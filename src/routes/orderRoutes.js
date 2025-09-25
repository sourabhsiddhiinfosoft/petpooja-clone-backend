import express from "express";
import { placeOrder, getOrder, listOrders, updateStatus, addPayment } from "../controllers/orderController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", requireRoles("owner","admin","staff"), placeOrder);
router.get("/", requireRoles("owner","admin","staff"), listOrders);
router.get("/:id", requireRoles("owner","admin","staff"), getOrder);
router.put("/:id/status", requireRoles("owner","admin","staff"), updateStatus);
router.post("/:id/payments", requireRoles("owner","admin","staff"), addPayment);

export default router;
