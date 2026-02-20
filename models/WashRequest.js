const mongoose = require("mongoose");

const washRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    transactionReference: {
      type: String,
      required: true,
      unique: true,
    },
    paymentProcessed: {
      type: Boolean,
      default: false,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle ID is required"],
    },
    serviceType: {
      type: String,
      enum: ["quick wash", "premium wash", "full wash"],
      required: [true, "Service type is required"],
    },
    outletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Outlet",
      required: [true, "Outlet ID is required"],
    },
    outletName: {
      type: String,
      required: [true, "Outlet name is required"],
    },
    outletLocation: {
      type: String,
      required: [true, "Outlet location is required"],
    },
    status: {
      type: String,
      enum: [
        "initiated",
        "scheduled",
        "order_received",
        "vehicle_checked",
        "in_progress",
        "drying_finishing",
        "ready_for_pickup",
        "completed",
        "cancelled",
      ],
      default: "initiated",// This can be updated to "scheduled" when payment is confirmed
    },
    washCode: {
      type: String,
      unique: true,
      required: true,
      length: 5,
    },
    statusTimeline: [
      {
        status: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          required: true,
          default: Date.now,
        },
        updatedBy: {
          type: String,
          enum: ["user", "outlet", "system"],
          default: "system",
        },
      },
    ],
    currentStep: {
      type: Number,
      default: 0,
      min: 0,
      max: 7,
    },
    steps: {
      type: [String],
      default: [
        "Wash Request Initiated",
        "Wash Booked Successfully",
        "Wash Order Received",
        "Vehicle Checked",
        "Wash in Progress",
        "Drying & Finishing",
        "Ready for Pickup",
        "Wash Completed",
      ],
    },
    vehicleInfo: {
      vehicleType: {
        type: String,
        required: true,
      },
      vehicleMake: {
        type: String,
        required: true,
      },
      licensePlate: {
        type: String,
        required: true,
      },
      vehicleModel: {
        type: String,
        required: true,
      },
      vehicleColor: {
        type: String,
        required: true,
      },
      image: {
        type: String,
        required: false,
      },
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending"],
      default: "pending",
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    notes: {
      type: String,
    },
    userRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    userReview: {
      type: String,
      maxlength: 500,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
washRequestSchema.index({ userId: 1, status: 1 });
washRequestSchema.index({ status: 1, createdAt: -1 });

// Update completedAt when status changes to completed (for .save() and .create())
washRequestSchema.pre("save", async function () {
  if (this.isModified("status")) {
    if (this.status === "completed" && !this.completedAt) {
      this.completedAt = new Date();
    }
    if (this.status === "cancelled" && !this.cancelledAt) {
      this.cancelledAt = new Date();
    }
  }
});

// Handle status changes for findOneAndUpdate, findByIdAndUpdate
washRequestSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate();
  if (update.$set && update.$set.status) {
    if (update.$set.status === "completed" && !update.$set.completedAt) {
      update.$set.completedAt = new Date();
    }
    if (update.$set.status === "cancelled" && !update.$set.cancelledAt) {
      update.$set.cancelledAt = new Date();
    }
  } else if (update.status) {
    if (update.status === "completed" && !update.completedAt) {
      update.completedAt = new Date();
    }
    if (update.status === "cancelled" && !update.cancelledAt) {
      update.cancelledAt = new Date();
    }
  }
});

module.exports = mongoose.model("WashRequest", washRequestSchema);
