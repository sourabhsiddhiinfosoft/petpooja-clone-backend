import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import bcrypt from "bcryptjs";

// Create Owner
export const createOwner = async (req, res) => {
  try {
    const { name, email, phone, password,restaurantId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const owner = await User.create({ name, email, phone, password: hashed,restaurantId, role: "owner" });

    res.status(201).json(owner);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// List all owners
export const listOwners = async (req, res) => {
  try {
    // Find all owners
    const owners = await User.find({ role: "owner" }).select("-password");

    // For each owner, find their restaurant (if any)
    const ownersWithRestaurant = await Promise.all(
      owners.map(async (owner) => {
        const restaurant = await Restaurant.findOne({ owner: owner._id }).select("_id name");
        return {
          ...owner.toObject(),
          restaurant: restaurant
            ? { _id: restaurant._id, name: restaurant.name }
            : null
        };
      })
    );

    res.json(ownersWithRestaurant);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

//Update Owner - name phone
export const updateOwner = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const owner = await User.findById(req.params.id);
    if (!owner || owner.role !== "owner") return res.status(404).json({ error: "Owner not found" });    
    if (name) owner.name = name;
    if (phone) owner.phone = phone;
    await owner.save();
    res.json(owner);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

// Assign owner to restaurant
export const assignOwner = async (req, res) => {
  try {
    const { restaurantId, ownerId } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

    const owner = await User.findById(ownerId);
    if (!owner || owner.role !== "owner") return res.status(400).json({ error: "Invalid owner" });

    restaurant.owner = ownerId;
    await restaurant.save();

    res.json({ message: "Owner assigned successfully", restaurant });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Remove owner from restaurant
export const removeOwner = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      // If restaurant not found, delete the user (owner) by id
      await User.findByIdAndDelete(req.params.id);
      return res.json({ message: "Owner deleted Succesfully." });
    }

    restaurant.owner = null;
    await restaurant.save();

    res.json({ message: "Owner removed from restaurant", restaurant });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
