import Branch from "../models/Branch.js";
import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";
import Category from "../models/Category.js";
import Area from "../models/Area.js";
import Table from "../models/Table.js";
import Staff from "../models/Staff.js";
import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import kotModel from "../models/kotModel.js";
import InventoryItem from "../models/InventoryItem.js";

export const createRestaurant = async (req, res) => {
  try {
    const {
      name,
      email,
      slug,
      phone,
      website,
      city,
      state,
      country,
      zipcode,
      address,
      domainName,
      cuisineType,
      openingHours,
      logo,
      description,
      GSTIN,
      FSSAI,
      isActive,
      subscription,
      subscriptionStatus,
      subscriptionStartDate,
      subscriptionEndDate,
      ownerName,
      ownerEmail,
      ownerPhone,
      ownerPassword,
    } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: "Name and slug are required" });
    }
    if (!ownerName || !ownerEmail || !ownerPassword) {
      return res.status(400).json({ error: "Owner name, email, and password are required" });
    }

    // 🔹 Check if owner user already exists
    const existingUser = await User.findOne({ email: ownerEmail });
    // if (existingUser) {
    //   return res.status(400).json({ error: "Owner with this email already exists" });
    // }

    let ownerUser;
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(ownerPassword, 10);


      // 🔹 Create Owner User
      ownerUser = await User.create({
        name: ownerName,
        email: ownerEmail,
        phone: ownerPhone,
        password: hashedPassword,
        role: "owner",
      });
    }
    console.log("Owner User:", ownerUser);
    // 🔹 Create Restaurant & link owner
    const restaurant = await Restaurant.create({
      name,
      email,
      slug,
      phone,
      website,
      city,
      state,
      country,
      zipcode,
      address,
      domainName,
      cuisineType,
      openingHours,
      logo,
      description,
      GSTIN,
      FSSAI,
      isActive,
      owner: ownerUser && ownerUser?._id, // link owner
      subscription,
      subscriptionStatus,
      subscriptionStartDate,
      subscriptionEndDate,
    });

     // Normalize address for branch (Branch.address expects an object)
    // let branchAddress = {};
    // if (address) {
    //   if (typeof address === "string") {
    //     branchAddress = { line1: address };
    //   } else if (typeof address === "object" && address !== null) {
    //     branchAddress = address;
    //   }
    // } else if (restaurant.address) {
    //   if (typeof restaurant.address === "string") branchAddress = { line1: restaurant.address };
    //   else branchAddress = restaurant.address;
    // }

    if(restaurant && restaurant?._id){
     // create a main branch for the restaurant
    const mainBranch = await Branch.create({
      restaurantId: restaurant._id,
      name: "Main Branch",
      tables: 0,
      status: "active",
    });
    if(mainBranch && mainBranch?._id){
    // ensure restaurant.branches keeps reference
    restaurant.branches = restaurant.branches || [];
    restaurant.branches.push(mainBranch?._id);
    await restaurant.save();
    }
  }


    res.status(201).json({
      message: "Restaurant and owner created successfully",
      restaurant,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};


export const getRestaurants = async (req, res) => {
  try {
    const data = await Restaurant.find().populate("owner", "name email phone");
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const getRestaurant = async (req, res) => {
  try {
    const item = await Restaurant.findById(req.params.id).populate("owner", "name email");
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


export const updateRestaurant = async (req, res) => {
  try {
    // const updateFields = {};
    // const allowedFields = [
    //   "name", "email", "slug", "phone", "website", "city", "state", "country", "zipcode", "address", "domainName",
    //   "adminName", "adminEmail", "adminPhone", "cuisineType", "openingHours", "logo", "description", "GSTIN", "FSSAI",
    //   "isActive", "owner", "subscription", "subscriptionStatus", "subscriptionStartDate", "subscriptionEndDate"
    // ];
    // allowedFields.forEach(field => {
    //   if (req.body[field] !== undefined) updateFields[field] = req.body[field];
    // });

    const data = req.body;
    const id = req.params.id;
    const item = await Restaurant.findByIdAndUpdate(id, data, { new: true });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Update successfully", restaurant: item });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Delete restaurant and all related data
export const deleteRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const rId = restaurant._id;

    // Remove related documents from other collections
    await Promise.all([
      Branch.deleteMany({ restaurantId: rId }),
      MenuItem.deleteMany({ restaurantId: rId }),
      Category.deleteMany({ restaurantId: rId }),
      Area.deleteMany({ restaurantId: rId }),
      Table.deleteMany({ restaurantId: rId }),
      kotModel.deleteMany({ restaurantId: rId }),
      Order.deleteMany({ restaurantId: rId }),
      InventoryItem.deleteMany({ restaurantId: rId }),
      Staff.deleteMany({ restaurantId: rId }),
    ]);

    // Finally remove restaurant document
    await Restaurant.findByIdAndDelete(rId);

    return res.json({ message: "Restaurant and all related data deleted successfully" });
  } catch (err) {
    next(err);
  }
};