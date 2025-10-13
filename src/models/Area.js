import mongoose from "mongoose";

const areaSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    type: { type: String, enum: ["single", "multiple", "all"], default: "single" },
  },
  { timestamps: true }
);

export default mongoose.model("Area", areaSchema);
