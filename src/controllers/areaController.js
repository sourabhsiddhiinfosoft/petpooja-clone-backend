import mongoose from "mongoose";
import Area from "../models/Area.js";
import Branch from "../models/Branch.js";
import Table from "../models/Table.js";

/**
 * CREATE AREA — single / multiple / all branches
 */
export const createArea = async (req, res) => {
  try {
    const {
      restaurantId: bodyRestaurantId,
      branchIds = [],
      type = "single",
      ...areaFields
    } = req.body;

    const resolvedRestaurantId = req.user?.restaurantId || bodyRestaurantId;
    if (!resolvedRestaurantId) {
      return res.status(400).json({ error: "restaurantId is required" });
    }

    // Helper: Validate that all branchIds belong to this restaurant
    const validateBranches = async (ids) => {
      const uniqueIds = [...new Set(ids)];
      const found = await Branch.find({
        _id: { $in: uniqueIds },
        restaurantId: resolvedRestaurantId,
      }).select("_id");
      return found.length === uniqueIds.length;
    };

    let createdAreas = [];

    /** CASE: ALL BRANCHES */
    if (type === "all") {
      const branches = await Branch.find({ restaurantId: resolvedRestaurantId }).select("_id");
      if (!branches.length) return res.status(404).json({ error: "No branches found" });

      if (areaFields.branchId) delete areaFields.branchId;

      createdAreas = await Promise.all(
        branches.map((b) =>
          Area.create({
            restaurantId: resolvedRestaurantId,
            branchId: b._id,
            type,
            ...areaFields,
          })
        )
      );
      return res.status(201).json({
        message: "Areas created for all branches",
        items: createdAreas,
      });
    }

    /** CASE: MULTIPLE BRANCHES */
    if (type === "multiple") {
      if (!Array.isArray(branchIds) || branchIds.length < 1) {
        return res.status(400).json({ error: "branchIds array required for 'multiple'" });
      }
      if (!(await validateBranches(branchIds))) {
        return res.status(400).json({ error: "One or more branchIds invalid for this restaurant" });
      }

      const uniqueIds = [...new Set(branchIds)];
      if (areaFields.branchId) delete areaFields.branchId;

      createdAreas = await Promise.all(
        uniqueIds.map((bid) =>
          Area.create({
            restaurantId: resolvedRestaurantId,
            branchId: bid,
            type,
            ...areaFields,
          })
        )
      );

      return res.status(201).json({
        message: "Areas created for multiple branches",
        items: createdAreas,
      });
    }

    /** CASE: SINGLE */
    const singleBranchId = (Array.isArray(branchIds) && branchIds[0]) || areaFields.branchId;
    if (!singleBranchId) {
      return res.status(400).json({ error: "branchId required for single area creation" });
    }

    const branchOk = await Branch.findOne({
      _id: singleBranchId,
      restaurantId: resolvedRestaurantId,
    }).select("_id");

    if (!branchOk) {
      return res.status(400).json({ error: "Branch not found or not linked to this restaurant" });
    }

    const area = await Area.create({
      restaurantId: resolvedRestaurantId,
      branchId: singleBranchId,
      type,
      ...areaFields,
    });

    return res.status(201).json(area);
  } catch (e) {
    console.error("createArea error:", e);
    return res.status(400).json({ error: e.message });
  }
};

/**
 * GET all areas for a restaurant (with table count)
 */
export const getAreasByRestaurant = async (req, res) => {
  try {
    const restaurantId =
      req.params.restaurantId || req.user.restaurantId || req.query.restaurantId;
    const branchId = req.query.branchId || req.params.branchId;

    if (!restaurantId) {
      return res.status(400).json({ error: "restaurantId required" });
    }

    const match = { restaurantId: new mongoose.Types.ObjectId(restaurantId) };
    if (branchId) {
      match.branchId = new mongoose.Types.ObjectId(branchId);
    }

    const areas = await Area.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "tables",
          localField: "_id",
          foreignField: "area",
          as: "tables",
        },
      },
      {
        $addFields: {
          tablesCount: { $size: "$tables" },
        },
      },
      { $project: { tables: 0 } },
      { $sort: { createdAt: 1 } },
    ]);

    res.json(areas);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


/**
 * GET single area
 */
export const getArea = async (req, res) => {
  try {
    const area = await Area.findById(req.params.id);
    if (!area) return res.status(404).json({ error: "Area not found" });
    res.json(area);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/**
 * UPDATE area
 */
export const updateArea = async (req, res) => {
  try {
    const area = await Area.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!area) return res.status(404).json({ error: "Area not found" });
    res.json(area);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

/**
 * DELETE area
 */
export const deleteArea = async (req, res) => {
  try {
    const area = await Area.findByIdAndDelete(req.params.id);
    if (!area) return res.status(404).json({ error: "Area not found" });
    res.json({ message: "Area deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


// GET areas with grouped tables (restaurantId required, branchId optional for filtering tables)
export const getAreasWithTables = async (req, res) => {
  try {
    const { branchId } = req.query;
    const restaurantId = req.user?.restaurantId || req.query?.restaurantId;

    // Validation
    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'restaurantId is required',
      });
    }

    // Find active areas for the restaurant (multi-branch support via branchIds)
    const areas = await Area.find({
      restaurantId,
      isActive: true,
      // Optional: Filter areas by branch if branchId provided (if areas are branch-specific)
      ...(branchId && { branchIds: { $in: [branchId] } }),
    })
      .select('name description tablesCount branchIds') // Select relevant fields
      .lean(); // Use lean for performance (returns plain JS objects)

    if (!areas || areas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No areas found for this restaurant',
        data: [],
      });
    }

    // For each area, fetch and filter tables (with currentOrder population)
    const areasWithTables = await Promise.all(
      areas.map(async (area) => {
        // Find tables for this area
        let tablesQuery = {
          area: area._id, // Reference to area
          restaurantId,
          isActive: true,
        };

        // Filter tables by branch if branchId provided (table must have branch in branchIds)
        if (branchId) {
          tablesQuery.branchIds = { $in: [branchId] };
        }

        const tables = await Table.find(tablesQuery)
          .select('name seats isActive branchIds status currentOrder') // Include currentOrder for selection
          .populate('currentOrder', 'status total createdAt items') // ✅ Populate order details if exists
          .lean(); // Lean after populate for performance

        // Optional: Add items count to currentOrder for summary (frontend can compute, but pre-compute here if needed)
        const tablesWithOrderSummary = tables.map(table => ({
          ...table,
          currentOrder: table.currentOrder ? {
            ...table.currentOrder,
            itemsCount: table.currentOrder.items ? table.currentOrder.items.length : 0 // Simple count
          } : null
        }));

        // Compute tablesCount if not stored in area
        const computedTablesCount = tablesWithOrderSummary.length;

        return {
          ...area,
          tablesCount: area.tablesCount || computedTablesCount, // Use stored or computed
          tables: tablesWithOrderSummary, // Grouped tables with order details
        };
      })
    );

    // Filter out areas with no tables (optional, based on Petpooja-like UX)
    const filteredAreasWithTables = areasWithTables.filter((area) => area.tables.length > 0);

    res.status(200).json({
      success: true,
      data: filteredAreasWithTables,
      message: 'Areas with tables fetched successfully',
      totalAreas: filteredAreasWithTables.length,
    });
  } catch (error) {
    console.error('Error fetching areas with tables:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching areas with tables',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined, // ✅ Fixed syntax
    });
  }
};



//old flow without branch
// import mongoose from "mongoose";
// import Area from "../models/Area.js";

// export const createArea = async (req, res) => {
//   try {
//     const body = { ...req.body, restaurantId: req.user.restaurantId || req.body.restaurantId };
//     const area = await Area.create(body);
//     res.status(201).json(area);
//   } catch (e) {
//     res.status(400).json({ error: e.message });
//   }
// };

// // export const getAreasByRestaurant = async (req, res) => {
// //   try {
// //     const restaurantId = req.params.restaurantId || req.user.restaurantId || req.query.restaurantId;
// //     if (!restaurantId) return res.status(400).json({ error: "restaurantId required" });
// //     const areas = await Area.find({ restaurantId }).sort({ createdAt: 1 });
// //     res.json(areas);
// //   } catch (e) {
// //     res.status(500).json({ error: e.message });
// //   }
// // };



// export const getAreasByRestaurant = async (req, res) => {
//   try {
//     const restaurantId =
//       req.params.restaurantId || req.user.restaurantId || req.query.restaurantId;
//     if (!restaurantId) {
//       return res.status(400).json({ error: "restaurantId required" });
//     }

//     const areas = await Area.aggregate([
//       {
//         $match: {
//           restaurantId: new mongoose.Types.ObjectId(restaurantId)
//         }
//       },
//       {
//         $lookup: {
//           from: "tables",       // collection name in Mongo (lowercase plural of model)
//           localField: "_id",    // Area._id
//           foreignField: "area", // Table.area
//           as: "tables"
//         }
//       },
//       {
//         $addFields: {
//           tablesCount: { $size: "$tables" }
//         }
//       },
//       {
//         $project: {
//           tables: 0 // don’t return whole tables array, only count
//         }
//       },
//       { $sort: { createdAt: 1 } }
//     ]);

//     res.json(areas);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };


// export const getArea = async (req, res) => {
//   try {
//     const area = await Area.findById(req.params.id);
//     if (!area) return res.status(404).json({ error: "Area not found" });
//     res.json(area);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };

// export const updateArea = async (req, res) => {
//   try {
//     const area = await Area.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!area) return res.status(404).json({ error: "Area not found" });
//     res.json(area);
//   } catch (e) {
//     res.status(400).json({ error: e.message });
//   }
// };

// export const deleteArea = async (req, res) => {
//   try {
//     const area = await Area.findByIdAndDelete(req.params.id);
//     if (!area) return res.status(404).json({ error: "Area not found" });
//     res.json({ message: "Area deleted" });
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };
