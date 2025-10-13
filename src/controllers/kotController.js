import kotModel from "../models/kotModel.js";
import Order from "../models/Order.js";

export const createKOT = async (req, res) => {
  try {
    const { orderId, items } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const kot = await kotModel.create({
      orderId,
      restaurantId: order.restaurantId,
      branchId: order.branchId, // ✅ new
      tableId: order.tableId,
      tableNo: order.tableNo,
      items
    });

    res.status(201).json(kot);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

export const listKOTs = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId || req.query.restaurantId;
    const branchId = req.query.branchId || req.user.branchId;
    if (!restaurantId) return res.status(400).json({ error: "restaurantId required" });
    if (!branchId) return res.status(400).json({ error: "branchId required" });

    const list = await kotModel
      .find({ restaurantId, branchId })
      .populate("orderId tableId")
      .sort({ createdAt: -1 });

    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// controllers/kotController.js (example)
export const updateKOTStatus = async (req, res) => {
  try {
    const { kotId } = req.params;
    const { status } = req.body; // From mutation body

    // Validation
    if (!['pending', 'preparing', 'ready'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be pending, preparing, or ready.' });
    }

    const kot = await KOT.findByIdAndUpdate(
      kotId, 
      { status }, 
      { new: true, runValidators: true } // Return updated doc
    );

    if (!kot) {
      return res.status(404).json({ error: 'KOT not found' });
    }

    // Optional: Update linked order status (e.g., if KOT ready → order preparing)
    if (status === 'ready') {
      await Order.findByIdAndUpdate(kot.orderId, { status: 'preparing' }); // Or custom logic
    }

    res.status(200).json({ 
      success: true, 
      data: kot, 
      message: `KOT status updated to ${status}` 
    });
  } catch (error) {
    console.error('Error updating KOT status:', error);
    res.status(500).json({ error: error.message });
  }
};


// export const updateKOTStatus = async (req, res) => {
//   try {
//     const { status } = req.body;
//     const kot = await kotModel.findByIdAndUpdate(req.params.id, { status }, { new: true });
//     if (!kot) return res.status(404).json({ error: "KOT not found" });
//     res.json(kot);
//   } catch (e) {
//     res.status(400).json({ error: e.message });
//   }
// };


// old code not with branch
// import kotModel from "../models/kotModel.js";
// import Order from "../models/Order.js";

// export const createKOT = async (req, res) => {
//   try {
//     const { orderId, items } = req.body;
//     const order = await Order.findById(orderId);
//     if (!order) return res.status(404).json({ error: "Order not found" });

//     const kot = await kotModel.create({
//       orderId,
//       restaurantId: order.restaurantId,
//       tableId: order.tableId,
//       tableNo: order.tableNo,
//       items
//     });

//     res.status(201).json(kot);
//   } catch (e) {
//     res.status(400).json({ error: e.message });
//   }
// };

// export const listKOTs = async (req, res) => {
//   try {
//     const restaurantId = req.user.restaurantId || req.query.restaurantId;
//     const list = await kotModel.find({ restaurantId }).populate("orderId tableId");
//     res.json(list);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };

// export const updateKOTStatus = async (req, res) => {
//   try {
//     const kot = await kotModel.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
//     if (!kot) return res.status(404).json({ error: "KOT not found" });
//     res.json(kot);
//   } catch (e) {
//     res.status(400).json({ error: e.message });
//   }
// };
