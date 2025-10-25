import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
  name: String,
  qty: { type: Number, default: 1 },
  price: { type: Number, required: true },
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  method: { type: String, enum: ["cash", "card", "upi", "wallet"], default: "cash" },
  amount: { type: Number, default: 0 },
  status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true }, // ✅ new
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
  type: { type: String, enum: ["dine-in", "takeaway", "delivery", "online"], default: "dine-in" },
  tableNo: String,
  customer: { name: String, phone: String, address: String },
  items: [orderItemSchema],
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  status: { type: String, enum: ["pending", "preparing", "ready", "completed", "cancelled"], default: "pending" },
  payments: [paymentSchema],
  paymentMethod: { type: String, default: "cash", enum: ["cash", "card", "online"] },

  kotIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "KOT" }], // ✅ track KOTs
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" }, // ✅ who made it
updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" }, // ✅ who updated last
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);



//old code not align with branch 
// import mongoose from "mongoose";

// const orderItemSchema = new mongoose.Schema({
//   menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
//   name: String,
//   qty: { type: Number, default: 1 },
//   price: { type: Number, required: true }
// }, {_id:false});

// const paymentSchema = new mongoose.Schema({
//   method: { type: String, enum: ["cash", "card", "upi", "wallet"], default: "cash" },
//   amount: { type: Number, default: 0 },
//   status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" }
// }, {_id:false});

// const orderSchema = new mongoose.Schema({
//   restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
//   tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
//   type: { type: String, enum: ["dine-in", "takeaway", "delivery", "online"], default: "dine-in" },
//   tableNo: String,
//   customer: { name: String, phone: String, address: String },
//   items: [orderItemSchema],
//   subtotal: { type: Number, default: 0 },
//   tax: { type: Number, default: 0 },
//   discount: { type: Number, default: 0 },
//   total: { type: Number, default: 0 },
//   status: { type: String, enum: ["pending", "preparing", "ready", "completed", "cancelled"], default: "pending" },
//   payments: [paymentSchema],
//   paymentMethod:{type:String,default:"cash",enum:["cash","card","online"]}
// }, { timestamps: true });

// export default mongoose.model("Order", orderSchema);
