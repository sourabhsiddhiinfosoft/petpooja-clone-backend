import express from "express";
import { createKOT, listKOTs, updateKOTStatus } from "../controllers/kotController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", requireRoles("owner","admin","staff"), createKOT);
router.get("/", requireRoles("owner","admin","staff"), listKOTs);
router.put("/:id/status", requireRoles("owner","admin","staff"), updateKOTStatus);

export default router;
