const { StatusCodes } = require("http-status-codes");
const WashRequestService = require("../services/WashRequestService");
const Vehicle = require("../models/Vehicle");

// @desc    Create a new wash request
// @route   POST /api/wash-requests
// @access  Private
exports.createWashRequest = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const vehicleId = req.body.vehicleId;

    if (!vehicleId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        statusCode: StatusCodes.BAD_REQUEST,
        error: "vehicleId is required",
      });
    }

    const vehicle   = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        statusCode: StatusCodes.NOT_FOUND,
        error: "Vehicle not found",
      });
    }

    const result = await WashRequestService.createWashRequestService(
      req.body,
      vehicle,
      userId,
    );

    if (result.error) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.error.message || result.error,
        errors: result.error.details || null,
      });
    }

    res.status(result.statusCode).json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    console.error("Create wash request error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Get all wash requests for authenticated user
// @route   GET /api/wash-requests
// @access  Private
exports.getWashRequests = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { status } = req.query; // Optional status filter

    const result = await WashRequestService.getWashRequestsService(
      userId,
      status,
    );

    if (result.error) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.error.message || result.error,
      });
    }

    res.status(result.statusCode).json({
      success: true,
      data: result.data,
      meta: result.meta,
      message: result.message,
    });
  } catch (error) {
    console.error("Get wash requests error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Get a single wash request by ID
// @route   GET /api/wash-requests/:id
// @access  Private
exports.getWashRequestById = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { id } = req.params;

    const result = await WashRequestService.getWashRequestByIdService(
      id,
      userId,
    );

    if (result.error) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.error.message || result.error,
      });
    }

    res.status(result.statusCode).json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    console.error("Get wash request error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Update a wash request
// @route   PATCH /api/wash-requests/:id
// @access  Private
exports.updateWashRequest = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { id } = req.params;

    const result = await WashRequestService.updateWashRequestService(
      id,
      req.body,
      userId,
    );

    if (result.error) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.error.message || result.error,
      });
    }

    res.status(result.statusCode).json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    console.error("Update wash request error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Cancel/Delete a wash request
// @route   DELETE /api/wash-requests/:id
// @access  Private
exports.deleteWashRequest = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { id } = req.params;

    const result = await WashRequestService.deleteWashRequestService(
      id,
      userId,
    );

    if (result.error) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.error.message || result.error,
      });
    }

    res.status(result.statusCode).json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    console.error("Delete wash request error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
