import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { signJwt } from "../utils/jwt.js";
import Restaurant from "../models/Restaurant.js";
import Staff from "../models/Staff.js";

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
    const { email: identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/Phone and password are required' });
    }

    let user = null;
    let userType = null;

    // Step 1: Try to find in User model (owners/admins) by email
    user = await User.findOne({ email: identifier });
    if (user) {
      userType = 'user';
      console.log('Login successful for User:', user.email); // Optional logging
    } else {
      // Step 2: If not found, try Staff model by email OR phone
      user = await Staff.findOne({
        $or: [
          { email: identifier },
          { phone: identifier } // Allows login with phone as "email"
        ],
        isActive: true // Only active staff can login
      });
      if (user) {
        userType = 'staff';
        console.log('Login successful for Staff:', user.phone || user.email); // Optional logging
      }
    }

    // Step 3: If no user/staff found
    if (!user) {
      return res.status(404).json({ error: 'User  or Staff not found' });
    }

    // Step 4: Verify password (for both models)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Step 5: Generate token with userType for role-based access
    const token = signJwt({ 
      id: user._id, 
      role: user.role, 
      userType // 'user' or 'staff'
    });

    // Step 6: Prepare response (consistent fields, add branchId for staff)
    const responseUser  = {
      id: user._id,
      name: user.name,
      email: userType === 'user' ? user.email : (user.phone || user.email || 'N/A'), // Use phone as email for staff consistency
      role: user.role,
      restaurantId: user.restaurantId,
      userType,
      ...(userType === 'staff' && { branchId: user.branchId }), // Extra for staff
    };

    res.json({ 
      token, 
      user: responseUser ,
      message: 'Login successful' 
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};


// export const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ error: "User not found" });
//     const ok = await bcrypt.compare(password, user.password);
//     if (!ok) return res.status(400).json({ error: "Invalid credentials" });
//     const token = signJwt({ id: user._id, role: user.role });
//     res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, restaurantId: user.restaurantId } });
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };

export const me = async (req, res) => {
  try {
    if(req?.user && req?.user?.userType === 'staff'){
      const staff = await Staff.findById(req.user.id).select("-password");
      if (!staff) return res.status(404).json({ error: "Staff not found" });
      return res.json(staff);
    }
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
