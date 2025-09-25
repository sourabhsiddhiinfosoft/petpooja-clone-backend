import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const addStaff = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const restaurantId = req.user.restaurantId;

    const hashed = await bcrypt.hash(password, 10);
    const staff = await User.create({
      name, email, phone,
      password: hashed,
      role: "staff",
      restaurantId
    });

    res.status(201).json({ message: "Staff created", staff });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

export const listStaff = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const staff = await User.find({ restaurantId, role: "staff" });
    res.json(staff);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const staff = await User.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user.restaurantId, role: "staff" },
      req.body,
      { new: true }
    );
    if (!staff) return res.status(404).json({ error: "Staff not found" });
    res.json({message:"Staff updated succesfully"});
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

export const deleteStaff = async (req, res) => {
  try {
    const staff = await User.findOneAndDelete({
      _id: req.params.id,
      restaurantId: req.user.restaurantId,
      role: "staff"
    });
    if (!staff) return res.status(404).json({ error: "Staff not found" });
    res.json({ message: "Staff removed" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
