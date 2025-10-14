import express from "express";
import { requireAuth, requireRoles } from "../middlewares/auth.js";
import { createBranch, deleteBranch, getBranch, listBranchesForRestaurant, updateBranch } from "../controllers/branchController.js";

const router = express.Router();

// Require authentication for all routes
router.use(requireAuth);

/**
 * Branches are always scoped under a restaurant.
 * Example: /api/restaurants/:restaurantId/branches
 */
router.post("/restaurants/:restaurantId/branches",requireRoles("owner", "admin"),createBranch);

router.get("/restaurants/:restaurantId/branches",requireRoles("owner", "admin", "staff"),listBranchesForRestaurant);

// Single branch operations
router.get("/:id",requireRoles("owner", "admin", "staff"),getBranch);

router.put("/:id",requireRoles("owner", "admin"),updateBranch);

router.delete("/:id",requireRoles("owner", "admin"),deleteBranch);

export default router;
