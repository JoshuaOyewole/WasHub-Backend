const express = require("express");
const router = express.Router();
const {
  createWashRequest,
  getWashRequests,
  getWashRequestById,
  updateWashRequest,
  deleteWashRequest,
} = require("../controllers/washRequestController");
const { getTokenFromHeaders, userOrAdmin } = require("../middlewares/auth");

// All routes require authentication
router.use(getTokenFromHeaders);
router.use(userOrAdmin);

// Create a new wash request
router.post("/", createWashRequest);

// Get all wash requests (with optional status filter)
router.get("/", getWashRequests);

// Get a single wash request by ID
router.get("/:id", getWashRequestById);

// Update a wash request
router.patch("/:id", updateWashRequest);

// Delete/Cancel a wash request
router.delete("/:id", deleteWashRequest);

module.exports = router;
