import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" }, // ✅ NEW
    area: { type: mongoose.Schema.Types.ObjectId, ref: "Area" },
    name: { type: String, required: true },
    seats: { type: Number, default: 2 },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved", "out-of-service"],
      default: "available",
    },
     currentOrder: { 
         type: mongoose.Schema.Types.ObjectId, 
         ref: 'Order', 
         default: null
       },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model("Table", tableSchema);



//old codewithout branches flow
// import mongoose from "mongoose";

// const tableSchema = new mongoose.Schema({
//   restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
//   area: { type: mongoose.Schema.Types.ObjectId, ref: "Area" },
//   name: { type: String, required: true }, // Table 1, T1, etc.
//   seats: { type: Number, default: 2 },
//   status: { type: String, enum: ["available","occupied","reserved","out-of-service"], default: "available" },
//   metadata: { type: mongoose.Schema.Types.Mixed } // any extra info
// }, { timestamps: true });

// export default mongoose.model("Table", tableSchema);
