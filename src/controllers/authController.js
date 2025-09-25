import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { signJwt } from "../utils/jwt.js";
import Restaurant from "../models/Restaurant.js";

export const register = async (req, res) => {
  try {
    const { name, email, password, role, restaurantId } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already registered" });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role, restaurantId });
    res.status(201).json({ message: "User registered", user: { id: user._id, name, email, role, restaurantId } });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });
    const token = signJwt({ id: user._id, role: user.role });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, restaurantId: user.restaurantId } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
     const restaurant = await Restaurant.findOne({ owner: user._id }).select("_id");
      if(restaurant){
        user.restaurantId=restaurant._id;
      }
      user.save();
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
