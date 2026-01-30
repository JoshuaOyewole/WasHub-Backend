const mongoose = require("mongoose");

const washRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
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
      enum: ["pending", "ongoing", "completed", "cancelled"],
      default: "pending",
    },
    currentStep: {
      type: Number,
      default: 0,
      min: 0,
      max: 4,
    },
    steps: {
      type: [String],
      default: ["Received", "Washing", "Finishing", "Ready"],
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
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
washRequestSchema.index({ userId: 1, status: 1 });
washRequestSchema.index({ status: 1, createdAt: -1 });

// Update completedAt when status changes to completed
washRequestSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (this.status === "completed" && !this.completedAt) {
      this.completedAt = new Date();
    }
    if (this.status === "cancelled" && !this.cancelledAt) {
      this.cancelledAt = new Date();
    }
  }
  next();
});

module.exports = mongoose.model("WashRequest", washRequestSchema);
