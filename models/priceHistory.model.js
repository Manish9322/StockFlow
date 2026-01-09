import mongoose from "mongoose";

const priceHistorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    priceType: {
      type: String,
      enum: ["costPrice", "sellingPrice"],
      required: [true, "Price type is required"],
    },
    oldPrice: {
      type: Number,
      required: [true, "Old price is required"],
      min: [0, "Price must be positive"],
    },
    newPrice: {
      type: Number,
      required: [true, "New price is required"],
      min: [0, "Price must be positive"],
    },
    changeAmount: {
      type: Number,
      required: true,
    },
    changePercentage: {
      type: Number,
    },
    reason: {
      type: String,
      trim: true,
    },
    changedBy: {
      userId: {
        type: String,
        required: true,
      },
      userName: {
        type: String,
        required: true,
      },
      userEmail: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
priceHistorySchema.index({ productId: 1, createdAt: -1 });
priceHistorySchema.index({ userId: 1, createdAt: -1 });
priceHistorySchema.index({ productId: 1, priceType: 1, createdAt: -1 });

// Calculate change amount and percentage before saving
priceHistorySchema.pre("save", function (next) {
  this.changeAmount = this.newPrice - this.oldPrice;
  if (this.oldPrice > 0) {
    this.changePercentage = ((this.newPrice - this.oldPrice) / this.oldPrice) * 100;
  }
  next();
});

const PriceHistory = mongoose.models.PriceHistory || mongoose.model("PriceHistory", priceHistorySchema);

export default PriceHistory;
