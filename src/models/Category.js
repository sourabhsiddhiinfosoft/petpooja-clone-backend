// models/Category.js
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    restaurantId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Restaurant", 
      required: true 
    },
    branchId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Branch", 
      default: null  // null means applies to all branches
    },
    name: { type: String, required: true },
    description: String,
    imageUrl: String,
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);




//old code before add branch flow
// import mongoose from "mongoose";

// const categorySchema = new mongoose.Schema(
//   {
//     restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
//     name: { type: String, required: true },
//     description: String,
//     imageUrl: String,
//     isActive: { type: Boolean, default: true }
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Category", categorySchema);
