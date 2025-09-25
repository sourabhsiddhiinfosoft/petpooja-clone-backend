import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

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
if(!existingUser){
    // 🔹 Hash owner password
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
      owner: ownerUser && ownerUser._id, // link owner
      subscription,
      subscriptionStatus,
      subscriptionStartDate,
      subscriptionEndDate,
    });

    res.status(201).json({
      message: "Restaurant and owner created successfully",
      restaurant,
      owner: {
        id: ownerUser._id,
        name: ownerUser.name,
        email: ownerUser.email,
        phone: ownerUser.phone,
      },
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};


export const getRestaurants = async (req, res) => {
  try {
    const data = await Restaurant.find().populate("owner","name email");
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const getRestaurant = async (req, res) => {
  try {
    const item = await Restaurant.findById(req.params.id).populate("owner","name email");
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


export const updateRestaurant = async (req, res) => {
  try {
    const updateFields = {};
    const allowedFields = [
      "name","email","slug","phone","website","city","state","country","zipcode","address","domainName",
      "adminName","adminEmail","adminPhone","cuisineType","openingHours","logo","description","GSTIN","FSSAI",
      "isActive","owner","subscription","subscriptionStatus","subscriptionStartDate","subscriptionEndDate"
    ];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updateFields[field] = req.body[field];
    });

    const item = await Restaurant.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Update successfully", restaurant: item });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

export const deleteRestaurant = async (req, res) => {
  try {
    const item = await Restaurant.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Restaurant deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
