const express = require("express");
const router = express.Router();
const {
  createOutlet,
  getOutlets,
  getOutletById,
  updateOutlet,
  deleteOutlet,
} = require("../controllers/outletController");
const {
  getTokenFromHeaders,
  outletOnly,
  userOrOutletOrAdmin,
} = require("../middlewares/auth");

// Protected routes - admin only
router.use(getTokenFromHeaders);
router.get("/", userOrOutletOrAdmin, getOutlets);
router.get("/:id", userOrOutletOrAdmin, getOutletById);

router.post("/", outletOnly, createOutlet);
router.patch("/:id", outletOnly, updateOutlet);
router.delete("/:id", outletOnly, deleteOutlet);

module.exports = router;
