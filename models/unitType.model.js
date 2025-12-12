import mongoose from "mongoose";

const unitTypeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for global admin-created unit types
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
    isGlobal: {
      type: Boolean,
      default: false, // True for admin-created global unit types
    },
  },
  {
    timestamps: true,
  }
);

// Unique indexes for global unit types
unitTypeSchema.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { isGlobal: true } }
);
unitTypeSchema.index(
  { abbreviation: 1 },
  { unique: true, partialFilterExpression: { isGlobal: true } }
);

// Compound unique indexes - name and abbreviation must be unique per user for non-global unit types
unitTypeSchema.index(
  { userId: 1, name: 1 },
  { unique: true, partialFilterExpression: { isGlobal: { $ne: true } } }
);
unitTypeSchema.index(
  { userId: 1, abbreviation: 1 },
  { unique: true, partialFilterExpression: { isGlobal: { $ne: true } } }
);

const UnitType = mongoose.models.UnitType || mongoose.model("UnitType", unitTypeSchema);

export default UnitType;
