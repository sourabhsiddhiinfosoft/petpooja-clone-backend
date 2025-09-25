import mongoose from "mongoose";

const kotItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
  name: String,
  qty: { type: Number, default: 1 }
}, { _id: false });

const kotSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
  tableNo: String,
  items: [kotItemSchema],
  status: { type: String, enum: ["pending", "preparing", "ready"], default: "pending" },
}, { timestamps: true });

export default mongoose.model("KOT", kotSchema);
