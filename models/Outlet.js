const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const geocoder = require("../utils/geocoder"); // We'll create this helper

const outletSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide outlet name"],
      maxlength: 100,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please provide outlet description"],
      maxlength: 800,
      minlength: 50,
    },

    // 📍 GeoJSON location
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      formattedAddress: String,
      city: String,
      state: String,
      country: String,
    },

    // Optional address fields for display
    address: {
      type: String,
      required: [true, "Please provide a full address"],
      maxlength: 200,
      trim: true,
    },

    phoneNumber: {
      type: String,
      maxlength: 20,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      maxlength: 100,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["outlet", "agent"],
      default: "outlet",
    },
    image: {
      type: String,
    },
    rating: {
      type: Number,
      default: 5,
      min: 0,
      max: 5,
    },
    activeWashes: {
      type: Number,
      default: 0,
      min: 0,
    },
    workingHours: {
      type: String,
      default: "8:00 AM - 6:00 PM",
    },
    services: {
      type: [String],
      default: ["Exterior Wash", "Interior Cleaning", "Full Service"],
    },
    pricing: {
      quickWash: { type: Number, default: 2500 },
      basic: { type: Number, default: 5000 },
      premium: { type: Number, default: 8500 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// 🔐 Hash password before saving
//
outletSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


//
// 🌍 Geocode address → coordinates (only when address changes)
//
outletSchema.pre("save", async function (next) {
  if (!this.isModified("address")) return next();

  try {
    const loc = await geocoder.geocode(this.address);
    if (loc?.length) {
      this.location = {
        type: "Point",
        coordinates: [loc[0].longitude, loc[0].latitude],
        formattedAddress: loc[0].formattedAddress,
        city: loc[0].city,
        state: loc[0].stateCode,
        country: loc[0].countryCode,
      };
    }
  } catch (err) {
    console.error("Geocoding failed:", err.message);
  }
  next();
});

//
// 🔑 Generate JWT
//
outletSchema.methods.getSignedJwtToken = function () {
  return require("jsonwebtoken").sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};
//
// 🔒 Match Password
//
outletSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
//
// 🗺️ Add Geo Index + Text Index
//
outletSchema.index({ location: "2dsphere" });
outletSchema.index({ address: "text", name: "text" });

module.exports = mongoose.model("Outlet", outletSchema);