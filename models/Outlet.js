const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const outletSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide outlet name"],
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, "Please provide outlet description"],
      maxlength: 1000,
      minlength: 100,
    },
    location: {
      type: String,
      required: [true, "Please provide location"],
      maxlength: 100,
    },
    address: {
      type: String,
      required: [true, "Please provide full address"],
      maxlength: 200,
    },
    city: {
      type: String,
      maxlength: 50,
    },
    state: {
      type: String,
      maxlength: 50,
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
      optional: true,
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
      quickWash: {
        type: Number,
        default: 2500,
      },
      basic: {
        type: Number,
        default: 5000,
      },
      premium: {
        type: Number,
        default: 8500,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Encrypt password using bcrypt
outletSchema.pre("save", async function () {
  // Only run this function if password was actually modified
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
outletSchema.methods.getSignedJwtToken = function () {
  return require("jsonwebtoken").sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE,
    }
  );
};

// Match outlet entered password to hashed password in database
outletSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Outlet", outletSchema);
