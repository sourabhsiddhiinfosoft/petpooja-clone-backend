import { verifyJwt } from "../utils/jwt.js";
import User from "../models/User.js";

export const requireAuth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = verifyJwt(token);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = { id: user._id, role: user.role, restaurantId: user.restaurantId };
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

export const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
  next();
};
