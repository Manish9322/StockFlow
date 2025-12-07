import mongoose from "mongoose";

const unitTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Unit type name is required"],
      trim: true,
      unique: true,
    },
    abbreviation: {
      type: String,
      required: [true, "Unit abbreviation is required"],
      trim: true,
      unique: true,
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

const UnitType = mongoose.models.UnitType || mongoose.model("UnitType", unitTypeSchema);

export default UnitType;
