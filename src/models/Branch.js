// models/Branch.js
import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  street: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  lat: { type: Number },
  lng: { type: Number },
});

const managerSchema = new mongoose.Schema({
  name: { type: String },
  phone: { type: String },
  email: { type: String },
});

const branchSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    name: { type: String, required: true },
    address: addressSchema,
    manager: managerSchema,
    tables: { type: Number, default: 0 },
    staff: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff",
      },
    ],
    menus: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Menu",
      },
    ],
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Branch", branchSchema);
