// models/MenuItem.js
import mongoose from "mongoose";

const addonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true }
});

const ingredientSchema = new mongoose.Schema({
  inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem", required: true },
  qty: { type: Number, required: true },
  name: { type: String }, // optional, for display
});

const menuItemSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null }, // NEW: optional branch reference
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
     image: { type: String },
    isAvailable: { type: Boolean, default: true },
    addons: [addonSchema],
    tags: [String],
    // sku: { type: String, unique: false }, // keep not globally unique, or enforce per-restaurant if needed
    ingredients: [ingredientSchema]
  },
  { timestamps: true }
);

// If you want sku unique per restaurant, create a compound index:
// menuItemSchema.index({ restaurantId: 1, sku: 1 }, { unique: true });

export default mongoose.model("MenuItem", menuItemSchema);
