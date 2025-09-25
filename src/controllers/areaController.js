import mongoose from "mongoose";
import Area from "../models/Area.js";

export const createArea = async (req, res) => {
  try {
    const body = { ...req.body, restaurantId: req.user.restaurantId || req.body.restaurantId };
    const area = await Area.create(body);
    res.status(201).json(area);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// export const getAreasByRestaurant = async (req, res) => {
//   try {
//     const restaurantId = req.params.restaurantId || req.user.restaurantId || req.query.restaurantId;
//     if (!restaurantId) return res.status(400).json({ error: "restaurantId required" });
//     const areas = await Area.find({ restaurantId }).sort({ createdAt: 1 });
//     res.json(areas);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };



export const getAreasByRestaurant = async (req, res) => {
  try {
    const restaurantId =
      req.params.restaurantId || req.user.restaurantId || req.query.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: "restaurantId required" });
    }

    const areas = await Area.aggregate([
      {
        $match: {
          restaurantId: new mongoose.Types.ObjectId(restaurantId)
        }
      },
      {
        $lookup: {
          from: "tables",       // collection name in Mongo (lowercase plural of model)
          localField: "_id",    // Area._id
          foreignField: "area", // Table.area
          as: "tables"
        }
      },
      {
        $addFields: {
          tablesCount: { $size: "$tables" }
        }
      },
      {
        $project: {
          tables: 0 // don’t return whole tables array, only count
        }
      },
      { $sort: { createdAt: 1 } }
    ]);

    res.json(areas);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


export const getArea = async (req, res) => {
  try {
    const area = await Area.findById(req.params.id);
    if (!area) return res.status(404).json({ error: "Area not found" });
    res.json(area);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const updateArea = async (req, res) => {
  try {
    const area = await Area.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!area) return res.status(404).json({ error: "Area not found" });
    res.json(area);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

export const deleteArea = async (req, res) => {
  try {
    const area = await Area.findByIdAndDelete(req.params.id);
    if (!area) return res.status(404).json({ error: "Area not found" });
    res.json({ message: "Area deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
