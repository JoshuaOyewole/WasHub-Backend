const mongoose = require("mongoose");

const deletedAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  firstname: {
    type: String,
    maxlength: 50,
  },
  lastname: {
    type: String,
    maxlength: 50,
  },
  phoneNumber: {
    type: String,
    maxlength: 14,
  },
  email: {
    type: String,
    lowercase: true,
  },
  dob: {
    type: Date,
  },
  profileImage: {
    type: String,
  },
  role: {
    type: String,
  },
  reason: {
    type: String,
    maxlength: 300,
  },
  deletedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("DeletedAccount", deletedAccountSchema);
