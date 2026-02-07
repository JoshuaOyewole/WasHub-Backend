const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getMe,
  updateProfile,
  deleteAccount,
  uploadProfileImage,
  changePassword,
  //logout,
  sendOTP,
  verifyOTP,
  checkEmail,
  forgotPassword,
  resetPassword,
  outletLogin,
} = require("../controllers/authController");
const multer = require("multer");
const {
  getTokenFromHeaders,
  userOrOutletOrAdmin,
  userOnly,
} = require("../middlewares/auth");



router.post("/register", register);
router.post("/login", login);
router.post("/outlet/login", outletLogin);
//router.post("/logout", protect, logout);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/check-email", checkEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected route - Get current user
router.use(getTokenFromHeaders);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },// 2MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error("Only JPG and PNG images are allowed"));
      return;
    }
    cb(null, true);
  },
});
router.get("/me", userOrOutletOrAdmin, getMe);
router.put("/profile", userOnly, updateProfile);
router.post("/change-password", userOnly, changePassword);
router.post(
  "/profile-image",
  userOnly,
  upload.single("image"),
  uploadProfileImage,
);
router.delete("/delete-account", userOnly, deleteAccount);


module.exports = router;
