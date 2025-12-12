import mongoose from "mongoose";
import { generatePurchaseId } from "../lib/purchase-id-generator.js";

const purchaseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    purchaseId: {
      type: String,
      unique: true,
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Purchase date is required"],
      default: Date.now,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        productName: {
          type: String,
          required: true,
        },
        productSku: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [1, "Quantity must be at least 1"],
        },
        unitPrice: {
          type: Number,
          required: [true, "Unit price is required"],
          min: [0, "Unit price must be positive"],
        },
        subtotal: {
          type: Number,
          required: true,
        },
      },
    ],
    subtotal: {
      type: Number,
      min: [0, "Subtotal must be positive"],
    },
    taxDetails: {
      gst: {
        type: Number,
        default: 0,
      },
      platformFee: {
        type: Number,
        default: 0,
      },
      otherTaxes: [
        new mongoose.Schema({
          name: { type: String },
          rate: { type: Number },
          type: { type: String },
          amount: { type: Number },
        }, { _id: false })
      ],
      totalTax: {
        type: Number,
        default: 0,
      },
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount must be positive"],
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Cancelled"],
      default: "Completed",
    },
    supplier: {
      type: String,
      trim: true,
      default: "N/A",
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Credit Card", "Bank Transfer", "Cheque", "Other"],
      default: "Cash",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate purchase ID before validation
purchaseSchema.pre("validate", async function () {
  if (!this.purchaseId) {
    // Generate a unique 12-character purchase ID
    let isUnique = false;
    let newPurchaseId;
    
    // Keep generating until we get a unique ID
    while (!isUnique) {
      newPurchaseId = generatePurchaseId();
      const existing = await this.constructor.findOne({ purchaseId: newPurchaseId });
      if (!existing) {
        isUnique = true;
      }
    }
    
    this.purchaseId = newPurchaseId;
  }
});

const Purchase = mongoose.models.Purchase || mongoose.model("Purchase", purchaseSchema);

export default Purchase;
