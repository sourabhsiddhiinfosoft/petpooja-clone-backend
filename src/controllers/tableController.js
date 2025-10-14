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

// GET running tables assigned to the logged-in staff/waiter
export const getRunningTablesByStaff = async (req, res) => {
  try {
    // const staffId = req.user._id; // From auth middleware (JWT)
    const staffId = req.params?.id || req.user?._id; // Support both staff and user IDs
console.log("staffId:", staffId);
    if (!staffId) {
      return res.status(401).json({ 
        success: false,
        error: 'Staff ID not found. Authentication required.' 
      });
    }

    console.log('Fetching running tables for staff:', staffId);

    // Find tables assigned to this staff with running statuses
    const tables = await Table.find({ 
      orderBy: staffId, 
      status: { $in: ['occupied', 'reserved'] }  
    })
      .populate('area', 'name description')  // Area details for grouping
      .populate('currentOrder', 'status total createdAt items')  // Current order summary
      .populate('orderBy', 'name email phone role')  // Polymorphic populate (Staff/User)
      .sort({ 'name': 1 })  // Alphabetical by table name
      .lean();  // Plain objects for performance

    if (!tables || tables.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No running tables assigned to this staff.'
      });
    }

    // Group by area for frontend rendering (optional; flat array if preferred)
    const groupedByArea = tables.reduce((acc, table) => {
      const areaId = table.area?._id || 'ungrouped';
      if (!acc[areaId]) {
        acc[areaId] = {
          _id: areaId,
          name: table.area?.name || 'Ungrouped Tables',
          description: table.area?.description || '',
          tables: []
        };
      }
      acc[areaId].tables.push(table);
      return acc;
    }, {});

    const groupedTables = Object.values(groupedByArea);

    res.status(200).json({
      success: true,
      data: groupedTables,  // [{ _id, name, tables: [...] }, ...]
      message: `Found ${tables.length} running tables for staff.`,
      totalTables: tables.length
    });
  } catch (error) {
    console.error('Error fetching running tables by staff:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Server error while fetching running tables' 
    });
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
