import mongoose from "mongoose";

// In your inventoryItemSchema, replace the existing fields with this updated version:
const inventoryItemSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String, default: "" },  // Add this
    category: { type: String, default: "" },     // Add this
    unit: { type: String, default: "kg" },       // Update default if needed
    currentQuantity: { type: Number, default: 0 },  // Rename from 'quantity' for consistency
    minQuantity: { type: Number, default: 0 },      // Rename from 'lowStockThreshold'
    maxQuantity: { type: Number, default: 1000 },   // Add this
    costPerUnit: { type: Number, default: 0 },      // Add this
    supplier: { type: String, default: "" },        // Keep this
    location: { type: String, default: "" },        // Add this
    expiryDate: { type: Date },                     // Add this
    isActive: { type: Boolean, default: true },     // Add this
  },
  { timestamps: true }
);

export default mongoose.model("InventoryItem", inventoryItemSchema);
