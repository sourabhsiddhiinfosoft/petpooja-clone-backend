import mongoose from "mongoose";
import Table from "../models/Table.js";
import Area from "../models/Area.js";
import Branch from "../models/Branch.js";

/**
 * Create Table(s) — supports single, multiple, or all branch creation
 */
export const createTable = async (req, res) => {
  try {
    const {
      restaurantId: bodyRestaurantId,
      branchIds = [],
      type = "single",
      area,
      ...tableFields
    } = req.body;

    const resolvedRestaurantId = req.user?.restaurantId || bodyRestaurantId;
    if (!resolvedRestaurantId) {
      return res.status(400).json({ error: "restaurantId is required" });
    }

    // helper: validate that all branches belong to restaurant
    const validateBranches = async (ids) => {
      const uniqueIds = [...new Set(ids)];
      const found = await Branch.find({
        _id: { $in: uniqueIds },
        restaurantId: resolvedRestaurantId,
      }).select("_id");
      return found.length === uniqueIds.length;
    };

    let createdTables = [];

    // 🟢 CASE: ALL branches
    if (type === "all") {
      const branches = await Branch.find({ restaurantId: resolvedRestaurantId }).select("_id");
      if (!branches.length) {
        return res.status(404).json({ error: "No branches found for this restaurant" });
      }

      if(tableFields?.branchId) delete tableFields?.branchId

      createdTables = await Promise.all(
        branches.map(async (b) => {
          if (area) {
            const areaDoc = await Area.findById(area);
            if (!areaDoc) throw new Error(`Area not found for branch ${b._id}`);
          }
          return Table.create({
            restaurantId: resolvedRestaurantId,
            branchId: b._id,
            area,
            ...tableFields,
          });
        })
      );

      return res
        .status(201)
        .json({ message: "Tables created for all branches", tables: createdTables });
    }

    // 🟢 CASE: MULTIPLE branches
    if (type === "multiple") {
      if (!Array.isArray(branchIds) || !branchIds.length) {
        return res.status(400).json({ error: "branchIds array required for type 'multiple'" });
      }
      if (!(await validateBranches(branchIds))) {
        return res
          .status(400)
          .json({ error: "One or more branchIds are invalid for this restaurant" });
      }
      
      if(tableFields?.branchId) delete tableFields?.branchId
      
      createdTables = await Promise.all(
        branchIds.map(async (bid) => {
          if (area) {
            const areaDoc = await Area.findById(area);
            if (!areaDoc) throw new Error(`Area not found for branch ${bid}`);
          }
          return Table.create({
            restaurantId: resolvedRestaurantId,
            branchId: bid,
            area,
            ...tableFields,
          });
        })
      );

      return res
        .status(201)
        .json({ message: "Tables created for multiple branches", tables: createdTables });
    }

    // 🟢 CASE: SINGLE (default)
    const singleBranchId = (Array.isArray(branchIds) && branchIds[0]) || req.body.branchId;
    if (!singleBranchId) {
      return res.status(400).json({ error: "branchId required for single table creation" });
    }

    const branchOk = await Branch.findOne({
      _id: singleBranchId,
      restaurantId: resolvedRestaurantId,
    }).select("_id");
    if (!branchOk) {
      return res.status(400).json({ error: "Branch not found or doesn't belong to this restaurant" });
    }

    if (area) {
      const areaDoc = await Area.findById(area);
      if (!areaDoc) return res.status(400).json({ error: "Area not found" });
      if (String(areaDoc.restaurantId) !== String(resolvedRestaurantId)) {
        return res.status(400).json({ error: "Area does not belong to this restaurant" });
      }
    }

    const table = await Table.create({
      restaurantId: resolvedRestaurantId,
      branchId: singleBranchId,
      area,
      ...tableFields,
    });

    return res.status(201).json(table);
  } catch (e) {
    console.error("createTable error:", e);
    return res.status(400).json({ error: e.message });
  }
};

/**
 * Get all tables — supports optional branchId filtering
 */
export const getTablesByRestaurant = async (req, res) => {
  try {
    const restaurantId =
      req.params.restaurantId || req.user.restaurantId || req.query.restaurantId;
    const branchId = req.query.branchId;

    if (!restaurantId) return res.status(400).json({ error: "restaurantId required" });

    const filter = { restaurantId };
    if (branchId) filter.branchId = branchId;

    const tables = await Table.find(filter).populate("area").sort({ name: 1 });
    res.json(tables);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const getTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id).populate("area");
    if (!table) return res.status(404).json({ error: "Table not found" });
    res.json(table);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const updateTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!table) return res.status(404).json({ error: "Table not found" });
    res.json(table);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

export const deleteTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) return res.status(404).json({ error: "Table not found" });
    res.json({ message: "Table deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const updateTableStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["available", "occupied", "reserved", "out-of-service"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const table = await Table.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!table) return res.status(404).json({ error: "Table not found" });
    res.json(table);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};


//old code without branches
// import Table from "../models/Table.js";
// import Area from "../models/Area.js";

// export const createTable = async (req, res) => {
//   try {
//     const body = { ...req.body, restaurantId: req.user.restaurantId || req.body.restaurantId };
//     // if area provided, ensure it belongs to same restaurant (optional check)
//     if (body.area) {
//       const area = await Area.findById(body.area);
//       if (!area) return res.status(400).json({ error: "Area not found" });
//       if (String(area.restaurantId) !== String(body.restaurantId || req.user.restaurantId)) {
//         return res.status(400).json({ error: "Area does not belong to the restaurant" });
//       }
//     }
//     const table = await Table.create(body);
//     res.status(201).json(table);
//   } catch (e) {
//     res.status(400).json({ error: e.message });
//   }
// };

// export const getTablesByRestaurant = async (req, res) => {
//   try {
//     const restaurantId = req.params.restaurantId || req.user.restaurantId || req.query.restaurantId;
//     if (!restaurantId) return res.status(400).json({ error: "restaurantId required" });
//     const tables = await Table.find({ restaurantId }).populate("area").sort({ name: 1 });
//     res.json(tables);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };

// export const getTable = async (req, res) => {
//   try {
//     const table = await Table.findById(req.params.id).populate("area");
//     if (!table) return res.status(404).json({ error: "Table not found" });
//     res.json(table);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };

// export const updateTable = async (req, res) => {
//   try {
//     const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!table) return res.status(404).json({ error: "Table not found" });
//     res.json(table);
//   } catch (e) {
//     res.status(400).json({ error: e.message });
//   }
// };

// export const deleteTable = async (req, res) => {
//   try {
//     const table = await Table.findByIdAndDelete(req.params.id);
//     if (!table) return res.status(404).json({ error: "Table not found" });
//     res.json({ message: "Table deleted" });
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };

// export const updateTableStatus = async (req, res) => {
//   try {
//     const { status } = req.body;
//     if (!["available","occupied","reserved","out-of-service"].includes(status)) {
//       return res.status(400).json({ error: "Invalid status" });
//     }
//     const table = await Table.findByIdAndUpdate(req.params.id, { status }, { new: true });
//     if (!table) return res.status(404).json({ error: "Table not found" });
//     res.json(table);
//   } catch (e) {
//     res.status(400).json({ error: e.message });
//   }
// };
