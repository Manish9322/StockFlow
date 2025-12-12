import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for global admin-created categories
      index: true,
    },
    name: {
      type: String,
      required: [true, "Category name is required"],
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
      default: false, // True for admin-created global categories
    },
  },
  {
    timestamps: true,
  }
);

// Unique index for global categories (name must be unique among global categories)
categorySchema.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { isGlobal: true } }
);

// Compound unique index - category name must be unique per user for non-global categories
categorySchema.index(
  { userId: 1, name: 1 },
  { unique: true, partialFilterExpression: { isGlobal: { $ne: true } } }
);

const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);

export default Category;
