import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    name: { type: String, required: true },
    description: String,
    imageUrl: String,
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
