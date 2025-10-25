import express from "express";
import { placeOrder, getOrder, listOrders, updateStatus, addPayment, updateOrder } from "../controllers/orderController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", requireRoles("owner","admin","staff","waiter"), placeOrder);
router.get("/", requireRoles("owner","admin","staff","waiter"), listOrders);
router.get("/:id", requireRoles("owner","admin","staff","waiter"), getOrder);
router.put("/:id/status", requireRoles("owner","admin","staff","waiter"), updateStatus);
router.post("/:id/payments", requireRoles("owner","admin","staff","waiter"), addPayment);
router.put('/:orderId', requireRoles('staff', 'waiter', 'owner'), updateOrder);


export default router;
