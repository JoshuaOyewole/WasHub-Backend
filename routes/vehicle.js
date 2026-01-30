const express = require("express");
const router = express.Router();
const {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  addToWash,
  removeFromWash,
} = require("../controllers/vehicleController");
const { getTokenFromHeaders, userOrAdmin } = require("../middlewares/auth");

router.use(getTokenFromHeaders);
router.use(userOrAdmin);

router.post("/", createVehicle);
router.get("/", getVehicles);
router.get("/:id", getVehicleById);
router.patch("/:id/add-to-wash", addToWash);
router.patch("/:id/remove-from-wash", removeFromWash);
router.patch("/:id", updateVehicle);
router.delete("/:id", deleteVehicle);

module.exports = router;
