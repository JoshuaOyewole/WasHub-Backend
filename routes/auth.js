const express = require("express");
const router = express.Router();

const {
  register,
  login,
  //getMe,
  //logout,
  sendOTP,
  verifyOTP,
} = require("../controllers/authController");
const { protect } = require("../middlewares/auth");



router.post("/register", register);
router.post("/login", login);
//router.post("/logout", protect, logout);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

//router.get("/me", protect, getMe);


module.exports = router;
