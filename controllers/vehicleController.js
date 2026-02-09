const { StatusCodes } = require("http-status-codes");
const VehicleService = require("../services/VehicleService");
const { uploadImageBuffer, deleteImageByUrl } = require("../utils/cloudinary");

// @desc Upload vehicle image
// @route POST /api/vehicles/upload-image
// @access Private
exports.uploadVehicleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: false,
        error: "No image file provided",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Delete the old image from Cloudinary if provided
    if (req.body.oldImageUrl) {
      await deleteImageByUrl(req.body.oldImageUrl);
    }

    const result = await uploadImageBuffer(req.file.buffer, {
      folder: "cars",
    });

    return res.status(StatusCodes.OK).json({
      status: true,
      data: { imageUrl: result.secure_url },
      message: "Image uploaded successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.error("Upload vehicle image error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      error: "Failed to upload image",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// @desc Create a vehicle
// @route POST /api/vehicles
// @access Private
exports.createVehicle = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await VehicleService.createVehicleService(req.body, userId);

    if (!result.status) {
      return res.status(result.statusCode).json({ status: result.status, error: result.error,statusCode: result.statusCode});
    }

    res.status(result.statusCode).json({ status: result.status, data: result.data, message: result.message, statusCode: result.statusCode });
  } catch (error) {
    console.error("Create vehicle error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: false, error: "Internal server error" });
  }
};

// @desc Get all vehicles for user
// @route GET /api/vehicles?inWishlist=true
// @access Private
exports.getVehicles = async (req, res) => {
  try {
    const userId = req.user.id;


    const { inWishlist } = req.query;
    const result = await VehicleService.getVehiclesService(userId, inWishlist);

    if (!result.status) {
      return res.status(result.statusCode).json({ status: result.status, message: result.error,statusCode: result.statusCode});
    }

    res.status(result.statusCode).json({ status: result.status, data: result.data, message: result.message, statusCode: result.statusCode });
  } catch (error) {
    console.error("Get vehicles error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: false, error: "Internal server error" });
  }
};

// @desc Get single vehicle
// @route GET /api/vehicles/:id
// @access Private
exports.getVehicleById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

  
    const result = await VehicleService.getVehicleByIdService(id, userId);


    if (!result.status) {
      return res.status(result.statusCode).json({ status: result.status, error: result.error,statusCode: result.statusCode});
    }

    res.status(result.statusCode).json({ status: result.status, data: result.data, message: result.message, statusCode: result.statusCode });
  } catch (error) {
    console.error("Get vehicle error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: false, error: "Internal server error" });
  }
};

// @desc Update vehicle
// @route PATCH /api/vehicles/:id
// @access Private
exports.updateVehicle = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await VehicleService.updateVehicleService(id, req.body, userId);

    if (!result.status) {
      return res.status(result.statusCode).json({ status: result.status, error: result.error,statusCode: result.statusCode});
    }

    res.status(result.statusCode).json({ status: result.status, data: result.data, message: result.message, statusCode: result.statusCode });
  } catch (error) {
    console.error("Update vehicle error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: false, error: "Internal server error" });
  }
};

// @desc Delete vehicle
// @route DELETE /api/vehicles/:id
// @access Private
exports.deleteVehicle = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await VehicleService.deleteVehicleService(id, userId);

    if (!result.status) {
      return res.status(result.statusCode).json({ status: result.status, error: result.error,statusCode: result.statusCode});
    }

    res.status(result.statusCode).json({ status: result.status, message: result.message, statusCode: result.statusCode });
  } catch (error) {
    console.error("Delete vehicle error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: false, error: "Internal server error", statusCode: StatusCodes.INTERNAL_SERVER_ERROR });
  }
};

// @desc Add vehicle to My Wash
// @route PATCH /api/vehicles/:id/add-to-wash
// @access Private
exports.addToWash = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await VehicleService.addToWashService(id, userId);

    if (!result.status) {
      return res.status(result.statusCode).json({ status: result.status, error: result.error, statusCode: result.statusCode });
    }

    res.status(result.statusCode).json({ status: result.status, data: result.data, message: result.message, statusCode: result.statusCode });
  } catch (error) {
    console.error("Add to wash error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: false, error: "Internal server error" });
  }
};

// @desc Remove vehicle from My Wash
// @route PATCH /api/vehicles/:id/remove-from-wash
// @access Private
exports.removeFromWash = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await VehicleService.removeFromWashService(id, userId);

    if (!result.status) {
      return res.status(result.statusCode).json({ status: result.status, error: result.error, statusCode: result.statusCode });
    }

    res.status(result.statusCode).json({ status: result.status, data: result.data, message: result.message, statusCode: result.statusCode });
  } catch (error) {
    console.error("Remove from wash error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: false, error: "Internal server error" });
  }
};
