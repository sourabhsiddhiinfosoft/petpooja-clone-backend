import Staff from "../models/Staff.js";
import bcrypt from "bcryptjs";

// ➕ Add Staff
export const addStaff = async (req, res) => {
  try {
    const { name, email, phone, password, role, branchId } = req.body;
    const restaurantId = req.user.restaurantId;

    const hashed = password ? await bcrypt.hash(password, 10) : null;

    const staff = await Staff.create({
      name,
      email,
      phone,
      password: hashed,
      role,
      branchId,
      restaurantId
    });

    res.status(201).json({ message: "Staff created", staff });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// 📋 List Staff (by branch or restaurant)
export const listStaff = async (req, res) => {
  try {
    const { branchId } = req.query;
    const restaurantId = req.user.restaurantId;

    const filter = { restaurantId };
    if (branchId) filter.branchId = branchId;

    const staff = await Staff.find(filter).sort({ createdAt: -1 });
    res.json(staff);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ✏️ Update Staff
export const updateStaff = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const staff = await Staff.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user.restaurantId },
      updateData,
      { new: true }
    );

    if (!staff) return res.status(404).json({ error: "Staff not found" });
    res.json({ message: "Staff updated successfully", staff });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// ❌ Delete Staff
export const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findOneAndDelete({
      _id: req.params.id,
      restaurantId: req.user.restaurantId
    });

    if (!staff) return res.status(404).json({ error: "Staff not found" });
    res.json({ message: "Staff removed" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// 🔄 Toggle Active Status
export const toggleStaffStatus = async (req, res) => {
  try {
    const staff = await Staff.findOne({
      _id: req.params.id,
      restaurantId: req.user.restaurantId,
    });

    if (!staff) return res.status(404).json({ error: "Staff not found" });

    staff.isActive = !staff.isActive;
    await staff.save();

    res.json({ message: "Staff status updated", staff });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


// staff manage on user model 30-sep-25

// import User from "../models/User.js";
// import bcrypt from "bcryptjs";

// export const addStaff = async (req, res) => {
//   try {
//     const { name, email, phone, password } = req.body;
//     const restaurantId = req.user.restaurantId;

//     const hashed = await bcrypt.hash(password, 10);
//     const staff = await User.create({
//       name, email, phone,
//       password: hashed,
//       role: "staff",
//       restaurantId
//     });

//     res.status(201).json({ message: "Staff created", staff });
//   } catch (e) {
//     res.status(400).json({ error: e.message });
//   }
// };

// export const listStaff = async (req, res) => {
//   try {
//     const restaurantId = req.user.restaurantId;
//     const staff = await User.find({ restaurantId, role: "staff" });
//     res.json(staff);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };

// export const updateStaff = async (req, res) => {
//   try {
//     const staff = await User.findOneAndUpdate(
//       { _id: req.params.id, restaurantId: req.user.restaurantId, role: "staff" },
//       req.body,
//       { new: true }
//     );
//     if (!staff) return res.status(404).json({ error: "Staff not found" });
//     res.json({message:"Staff updated succesfully"});
//   } catch (e) {
//     res.status(400).json({ error: e.message });
//   }
// };

// export const deleteStaff = async (req, res) => {
//   try {
//     const staff = await User.findOneAndDelete({
//       _id: req.params.id,
//       restaurantId: req.user.restaurantId,
//       role: "staff"
//     });
//     if (!staff) return res.status(404).json({ error: "Staff not found" });
//     res.json({ message: "Staff removed" });
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };
