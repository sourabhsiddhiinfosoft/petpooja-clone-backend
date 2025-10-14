//new code

// src/config/db.js
import mongoose from "mongoose";

// Cache the connection at the module level
let cachedConnection = null;

export async function connectDB(uri) {
  // If we have a cached connection, reuse it
  if (cachedConnection) {
    console.log("✅ Using existing MongoDB connection");
    return cachedConnection;
  }

  // Otherwise, create a new connection
  try {
    mongoose.set("strictQuery", true);
    const connection = await mongoose.connect(uri,{
      serverSelectionTimeoutMS: 5000,
    });
    cachedConnection = connection; // Cache the new connection
    console.log("✅ New MongoDB connection established");
    return connection;
  } catch (e) {
    console.error("Failed to connect to MongoDB", e);
    throw e;
  }
}


//26sep
// import mongoose from "mongoose";

// export async function connectDB(uri) {
//   mongoose.set("strictQuery", true);
//   await mongoose.connect(uri);
//   console.log("✅ MongoDB connected");
// }
