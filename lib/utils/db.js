import { MONGODB_URI } from "../../config/config";
import mongoose from "mongoose";

const _db = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState >= 1) {
      return;
    }

    // Validate MONGODB_URI
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw error; // Don't exit process in Next.js API routes
  }
};

export default _db;