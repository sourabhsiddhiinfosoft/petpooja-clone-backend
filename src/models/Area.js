import mongoose from "mongoose";

const areaSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  name: { type: String, required: true }, // e.g., Ground Floor, 1st Floor, Rooftop
  description: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Area", areaSchema);
