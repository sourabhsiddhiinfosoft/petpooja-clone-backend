// models/Customer.js
import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
}, { timestamps: true });

export default mongoose.model("Customer", customerSchema);
