import mongoose from "mongoose";

const userSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    profile: {
      name: String,
      email: String,
    },
    preferences: {
      lowStockThreshold: {
        type: Number,
        default: 10,
      },
      currency: {
        type: String,
        default: "USD",
      },
      timezone: {
        type: String,
        default: "UTC",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development
export default mongoose.models.UserSettings || mongoose.model("UserSettings", userSettingsSchema);
