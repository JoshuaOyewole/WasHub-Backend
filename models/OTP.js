const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Please provide a email"],
    maxlength: 50,
  },
  otpHash: {
    type: String,
    required: [true, "Please provide a OTP hash"],
  },
  OTPcategory: {
    type: String,
    enum: ["password_reset", "email_verification"],
    required: [true, "Please provide an OTP category"],
  },
  expiresAt: {
    type: Date,
    required: [true, "Please provide an expiration time for the OTP"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("OTP", OTPSchema);
