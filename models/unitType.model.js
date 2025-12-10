import mongoose from "mongoose";

const unitTypeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Unit type name is required"],
      trim: true,
    },
    abbreviation: {
      type: String,
      required: [true, "Unit abbreviation is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique indexes - name and abbreviation must be unique per user
unitTypeSchema.index({ userId: 1, name: 1 }, { unique: true });
unitTypeSchema.index({ userId: 1, abbreviation: 1 }, { unique: true });

const UnitType = mongoose.models.UnitType || mongoose.model("UnitType", unitTypeSchema);

export default UnitType;
