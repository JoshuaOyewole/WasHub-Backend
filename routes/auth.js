const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getMe,
  //logout,
  sendOTP,
  verifyOTP,
  checkEmail,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { getTokenFromHeaders, userOrAdmin } = require("../middlewares/auth");



router.post("/register", register);
router.post("/login", login);
//router.post("/logout", protect, logout);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/check-email", checkEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected route - Get current user
router.get("/me", getTokenFromHeaders, userOrAdmin, getMe);


module.exports = router;
