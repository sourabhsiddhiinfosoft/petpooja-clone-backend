import mongoose from "mongoose";


const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  slug: { type: String, required: true },
  phone: { type: String },
  website: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  zipcode: { type: String },
  address: { type: String },
  domainName: { type: String },
  cuisineType: { type: String },
  openingHours: { type: String },
  logo: { type: String },
  description: { type: String },
  GSTIN: { type: String },
  FSSAI: { type: String },
  isActive: { type: Boolean, default: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
  subscriptionStatus: { type: Boolean, default: false },
  subscriptionStartDate: { type: Date },
  subscriptionEndDate: { type: Date },
}, { timestamps: true });

export default mongoose.model("Restaurant", restaurantSchema);
