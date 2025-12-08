import mongoose from "mongoose";

const movementSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: [true, "Event type is required"],
      enum: [
        "product.created",
        "product.updated",
        "product.deleted",
        "stock.changed",
        "stock.refill",
        "category.created",
        "category.updated",
        "category.deleted",
        "purchase.created",
        "purchase.updated",
        "purchase.deleted",
        "settings.changed",
        "auth.login",
        "auth.logout",
      ],
    },
    eventTitle: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    userId: {
      type: String,
      required: [true, "User ID is required"],
      trim: true,
    },
    userName: {
      type: String,
      required: [true, "User name is required"],
      trim: true,
    },
    userEmail: {
      type: String,
      trim: true,
    },
    // Reference to related entities
    relatedProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    relatedPurchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
    },
    relatedCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    // Additional metadata for the event
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Change tracking
    changes: {
      before: {
        type: mongoose.Schema.Types.Mixed,
      },
      after: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
    // IP address for security tracking
    ipAddress: {
      type: String,
      trim: true,
    },
    // User agent for device tracking
    userAgent: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
movementSchema.index({ eventType: 1 });
movementSchema.index({ userId: 1 });
movementSchema.index({ createdAt: -1 });
movementSchema.index({ relatedProduct: 1 });
movementSchema.index({ relatedPurchase: 1 });

const Movement = mongoose.models.Movement || mongoose.model("Movement", movementSchema);

export default Movement;
