const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
  },
  vehicleType: {
    type: String,
    required: [true, "Please provide a vehicle type"],
    maxlength: 50,
  },
  vehicleMake: {
    type: String,
    required: [true, "Please provide a vehicle make"],
    maxlength: 50,
  },
  vehicleModel: {
    type: String,
    required: [true, "Please provide a vehicle model"],
    maxlength: 50,
  },
  vehicleYear: {
    type: String,
    required: [true, "Please provide a vehicle year"],
    maxlength: 50,
  },
  vehicleColor: {
    type: String,
    maxlength: 50,
  },
  plateNumber: {
    type: String,
    required: [true, "Please provide a plate number"],
    maxlength: 20,
    set: (v) => v.toUpperCase().replace(/\s|-/g, ""),
  },
  image: {
    type: String,
    required: false,
  },
  inWishlist: {
    type: Boolean,
    default: false,
  },
  wishlistAddedAt: {
    type: Date,
  },
}, { timestamps: true });

vehicleSchema.index({ plateNumber: 1 }, { unique: true });
module.exports = mongoose.model("Vehicle", vehicleSchema);