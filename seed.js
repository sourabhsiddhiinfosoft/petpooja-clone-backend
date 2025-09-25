import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Restaurant from "./models/Restaurant.js";
import Area from "./models/Area.js";
import Table from "./models/Table.js";
import MenuItem from "./models/MenuItem.js";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function seed() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("✅ MongoDB Connected for seeding...");

    // Clear old data
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await Area.deleteMany({});
    await Table.deleteMany({});
    await MenuItem.deleteMany({});

    // Create Admin user
    const admin = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: "Admin@123",
      role: "admin"
    });

    // Create Owner user
    const owner = await User.create({
      name: "Restaurant Owner",
      email: "owner@example.com",
      password: "Owner@123",
      role: "owner"
    });

    // Create Restaurant
    const restaurant = await Restaurant.create({
      name: "Spice Hub",
      phone: "9876543210",
      address: "Main Street, City",
      owner: owner._id
    });

    // Create Areas
    const groundFloor = await Area.create({ name: "Ground Floor", restaurant: restaurant._id });
    const rooftop = await Area.create({ name: "Rooftop", restaurant: restaurant._id });

    // Create Tables
    const tables = [];
    for (let i = 1; i <= 3; i++) {
      tables.push(await Table.create({ name: `T${i}`, area: groundFloor._id, restaurant: restaurant._id }));
    }
    for (let i = 4; i <= 6; i++) {
      tables.push(await Table.create({ name: `T${i}`, area: rooftop._id, restaurant: restaurant._id }));
    }

    // Create Menu Items
    const pizza = await MenuItem.create({
      restaurant: restaurant._id,
      name: "Margherita Pizza",
      category: "Main Course",
      price: 250
    });
    const pasta = await MenuItem.create({
      restaurant: restaurant._id,
      name: "Creamy Pasta",
      category: "Main Course",
      price: 200
    });
    const coke = await MenuItem.create({
      restaurant: restaurant._id,
      name: "Coca Cola",
      category: "Beverages",
      price: 60
    });

    console.log("🌱 Seed data inserted successfully!");
    process.exit();
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
}

seed();
