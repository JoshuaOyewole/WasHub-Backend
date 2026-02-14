const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  addToWash,
  removeFromWash,
  uploadVehicleImage,
} = require("../controllers/vehicleController");
const { getTokenFromHeaders, userOnly } = require("../middlewares/auth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error("Only JPG and PNG images are allowed"));
      return;
    }
    cb(null, true);
  },
});

router.use(getTokenFromHeaders);
router.use(userOnly);

router.post("/upload-image", upload.single("image"), uploadVehicleImage);
router.post("/", upload.single("image"), createVehicle);
router.get("/", getVehicles);
router.get("/:id", getVehicleById);
router.patch("/:id/add-to-wash", addToWash);
router.patch("/:id/remove-from-wash", removeFromWash);
router.patch("/:id", updateVehicle);
router.delete("/:id", deleteVehicle);

module.exports = router;
