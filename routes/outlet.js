const express = require("express");
const router = express.Router();
const {
  createOutlet,
  getOutlets,
  getOutletById,
  updateOutlet,
  deleteOutlet,
  getOutletNearby,
  searchOutletByAddress
} = require("../controllers/outletController");
const {
  getTokenFromHeaders,
  outletOnly,
  userOrOutletOrAdmin,
  userOnly,
} = require("../middlewares/auth");
const { rateLimit } = require("../middlewares/rateLimit");

// Rate limiter for search (geocoding calls)
const searchLimiter = rateLimit({ windowMs: 60_000, max: 30 });

router.get("/nearby", getTokenFromHeaders, userOnly, getOutletNearby);

// Protected routes - admin only
router.use(getTokenFromHeaders);
router.get("/search", userOnly, searchLimiter, searchOutletByAddress);
router.get("/", userOrOutletOrAdmin, getOutlets);
router.get("/:id", userOrOutletOrAdmin, getOutletById);




router.post("/", outletOnly, createOutlet);
router.patch("/:id", outletOnly, updateOutlet);
router.delete("/:id", outletOnly, deleteOutlet);

module.exports = router;
