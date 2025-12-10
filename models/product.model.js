import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    unitType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UnitType",
      required: [true, "Unit type is required"],
    },
    unitSize: {
      type: Number,
      required: [true, "Unit size is required"],
      min: [0, "Unit size must be positive"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
    costPrice: {
      type: Number,
      required: [true, "Cost price is required"],
      min: [0, "Cost price must be positive"],
    },
    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [0, "Selling price must be positive"],
    },
    supplier: {
      type: String,
      required: [true, "Supplier is required"],
      trim: true,
    },
    supplierContact: {
      type: String,
      trim: true,
    },
    supplierRegistrationNumber: {
      type: String,
      trim: true,
    },
    purchaseDate: {
      type: Date,
    },
    expiryDate: {
      type: Date,
    },
    minStockAlert: {
      type: Number,
      required: [true, "Minimum stock alert is required"],
      min: [0, "Minimum stock alert must be positive"],
      default: 10,
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "discontinued"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
productSchema.index({ userId: 1, createdAt: -1 });
productSchema.index({ userId: 1, category: 1 });
productSchema.index({ userId: 1, sku: 1 }, { unique: true });
productSchema.index({ userId: 1, status: 1 });

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
