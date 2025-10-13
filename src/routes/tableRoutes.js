import express from "express";
import {
  createTable,
  getTablesByRestaurant,
  getTable,
  updateTable,
  deleteTable,
  updateTableStatus,
} from "../controllers/tableController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", requireRoles("owner", "admin"), createTable);
router.get("/restaurant/:restaurantId", requireRoles("owner", "admin", "staff","waiter"), getTablesByRestaurant);
router.get("/:id", requireRoles("owner", "admin", "staff","waiter"), getTable);
router.put("/:id", requireRoles("owner", "admin","waiter"), updateTable);
router.delete("/:id", requireRoles("owner", "admin"), deleteTable);
router.put("/:id/status", requireRoles("owner", "admin", "staff"), updateTableStatus);

export default router;



//old table routes withiut branch  flow
// import express from "express";
// import { createTable, getTablesByRestaurant, getTable, updateTable, deleteTable, updateTableStatus } from "../controllers/tableController.js";
// import { requireAuth, requireRoles } from "../middlewares/auth.js";

// const router = express.Router();
// router.use(requireAuth);

// router.post("/", requireRoles("owner","admin"), createTable);
// router.get("/restaurant/:restaurantId", requireRoles("owner","admin","staff"), getTablesByRestaurant);
// router.get("/:id", requireRoles("owner","admin","staff"), getTable);
// router.put("/:id", requireRoles("owner","admin"), updateTable);
// router.delete("/:id", requireRoles("owner","admin"), deleteTable);

// // Staff can change table status (e.g., occupy/free)
// router.put("/:id/status", requireRoles("owner","admin","staff"), updateTableStatus);

// export default router;
