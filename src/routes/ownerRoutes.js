import express from "express";
import { createOwner, listOwners, assignOwner, removeOwner, updateOwner } from "../controllers/ownerController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRoles("admin"));

// Admin → Manage Owners
router.post("/", createOwner);  //create owner
router.put("/:id",updateOwner)      // update owner
router.get("/", listOwners);          // List owners
router.post("/assign", assignOwner);  // Assign owner to restaurant
router.delete("/remove/:id", removeOwner); // Remove owner from restaurant

export default router;
