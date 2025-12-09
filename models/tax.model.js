import mongoose from "mongoose";

const taxChangeHistorySchema = new mongoose.Schema({
  changedBy: {
    type: String,
    required: true,
  },
  changedByEmail: String,
  changeDate: {
    type: Date,
    default: Date.now,
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  description: String,
});

const taxConfigSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    gst: {
      enabled: {
        type: Boolean,
        default: false,
      },
      rate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      type: {
        type: String,
        enum: ["inclusive", "exclusive"],
        default: "exclusive",
      },
      description: String,
    },
    platformFee: {
      enabled: {
        type: Boolean,
        default: false,
      },
      rate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      type: {
        type: String,
        enum: ["percentage", "fixed"],
        default: "percentage",
      },
      description: String,
    },
    otherTaxes: [
      {
        name: {
          type: String,
          required: true,
        },
        enabled: {
          type: Boolean,
          default: true,
        },
        rate: {
          type: Number,
          required: true,
          min: 0,
        },
        type: {
          type: String,
          enum: ["percentage", "fixed"],
          default: "percentage",
        },
        description: String,
      },
    ],
    changeHistory: [taxChangeHistorySchema],
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

// Ensure only one tax config per user
taxConfigSchema.index({ userId: 1 }, { unique: true });

const TaxConfig = mongoose.models.TaxConfig || mongoose.model("TaxConfig", taxConfigSchema);

export default TaxConfig;
