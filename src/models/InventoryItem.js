import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  name: { type: String, required: true },
  unit: { type: String, default: "pcs" }, // g, kg, ml, l, pcs
  quantity: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 0 },
  supplier: { type: String }
}, { timestamps: true });

export default mongoose.model("InventoryItem", inventoryItemSchema);
