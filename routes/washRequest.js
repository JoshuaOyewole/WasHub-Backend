const express = require("express");
const router = express.Router();
const {
  createWashRequest,
  getWashRequests,
  getWashRequestById,
  updateWashRequest,
  updateWashRequestStatus,
  deleteWashRequest,
  verifyWashCode,
  updateWashStatusByCode,
  submitWashReview,
} = require("../controllers/washRequestController");
const { getTokenFromHeaders, userOrOutletOrAdmin, outletOnly, userOnly } = require("../middlewares/auth");

// All routes require authentication
router.use(getTokenFromHeaders);

// Create a new wash request
router.post("/", userOnly,createWashRequest);
// Get all wash requests (with optional status filter)
router.get("/", userOrOutletOrAdmin, getWashRequests);
// Get a single wash request by ID
router.get("/:id", userOrOutletOrAdmin, getWashRequestById);

// Submit a review for a completed wash (user only)
router.patch("/:id/review", userOnly, submitWashReview);

// Outlet/Agent routes
router.post("/verify-code", outletOnly, verifyWashCode);
router.patch("/update-status", outletOnly, updateWashStatusByCode);



// Update wash request status (for outlets/admins)
router.patch("/:id/status", outletOnly, updateWashRequestStatus);

// Update a wash request
router.patch("/:id",outletOnly, updateWashRequest);

// Delete/Cancel a wash request
router.delete("/:id", userOrOutletOrAdmin, deleteWashRequest);

module.exports = router;
