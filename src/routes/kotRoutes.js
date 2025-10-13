import express from "express";
import { createKOT, listKOTs, updateKOTStatus } from "../controllers/kotController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", requireRoles("owner","admin","staff","waiter","chef"), createKOT);
router.get("/", requireRoles("owner","admin","staff","waiter","chef"), listKOTs);
router.put("/:id/status", requireRoles("owner","admin","staff","waiter","chef"), updateKOTStatus);

export default router;
