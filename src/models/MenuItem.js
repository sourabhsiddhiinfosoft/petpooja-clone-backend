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
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    imageUrl: String,
    isAvailable: { type: Boolean, default: true },
    addons: [addonSchema],
    tags: [String],
    sku: { type: String, unique: true },
    ingredients: [ingredientSchema]
  },
  { timestamps: true }
);

export default mongoose.model("MenuItem", menuItemSchema);
