const { StatusCodes } = require("http-status-codes");
const WashRequestService = require("../services/WashRequestService");
const PaymentService = require("../services/paymentService");
const Vehicle = require("../models/Vehicle");
const { saveTransactionIntentWithRetry } = require("../utils/helpers");

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

    const vehicle = await Vehicle.findById(vehicleId);


    if (!vehicle) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        statusCode: StatusCodes.NOT_FOUND,
        error: "Vehicle not found",
      });
    }

    const txnRef = await PaymentService.initiatePaystackPayment({
      email: req.user.email,
      amount: req.body.price,
    });

    const result = await WashRequestService.createWashRequestService({
      body: req.body,
      vehicle,
      userId,
      transactionReference: txnRef.data.reference,
    });

    console.log("Wash request creation result:", result);
    if (result.error) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.error.message || result.error,
        errors: result.error.details || null,
      });
    }

    // Save transaction intent in background (must not affect API response)
    saveTransactionIntentWithRetry({
      email: req.user.email,
      userId: req.user.id,
      amount: req.body.price,
      reference: txnRef.data.reference,
      details: {
        authorization_url: txnRef.data.authorization_url,
        purpose: "wash_request",
        gateway: "paystack",
      },
      status: "initiated",
    });

    res.status(result.statusCode).json({
      success: true,
      data: {
        _id: result.data._id,
        userEmail: req.user.email,
        notes: result.data.notes,
        outletId: result.data.outletId,
        outletLocation: result.data.outletLocation,
        outletName: result.data.outletName,
        price: result.data.price,
        serviceType: result.data.serviceType,
        status: result.data.status,
        transactionReference: result.data.transactionReference,
        userId: result.data.userId,
        vehicleId: result.data.vehicleId,
        vehicleInfo: result.data.vehicleInfo,
        payment: {
          paymentStatus: result.data.paymentStatus,
          paymentProcessed: result.data.paymentProcessed,
          reference: txnRef.data.reference,
          authorization_url: txnRef.data.authorization_url,
          access_code: txnRef.data.access_code,
        },
      },
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

// @desc    Update wash request status (for outlets/admins)
// @route   PATCH /api/wash-requests/:id/status
// @access  Private (outlet/admin)
exports.updateWashRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log("Updating wash request status:", { id, status });
    if (!status) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        statusCode: StatusCodes.BAD_REQUEST,
        error: "Status is required",
      });
    }

    const result = await WashRequestService.updateWashRequestStatusService(
      id,
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
      message: result.message,
    });
  } catch (error) {
    console.error("Update wash request status error:", error);
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

// @desc    Verify wash code (for outlets/agents)
// @route   POST /api/wash-requests/verify-code
// @access  Private (Outlet/Agent)
exports.verifyWashCode = async (req, res) => {
  try {
    const { washCode } = req.body;
    console.log("Verifying wash code:", washCode);
    if (!washCode) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        statusCode: StatusCodes.BAD_REQUEST,
        error: "Wash code is required",
      });
    }

    const result = await WashRequestService.verifyWashCodeService(washCode);

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
    console.error("Verify wash code error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Update wash status by code (for outlets/agents)
// @route   PATCH /api/wash-requests/update-status
// @access  Private (Outlet/Agent)
exports.updateWashStatusByCode = async (req, res) => {
  try {
    const { washCode, status } = req.body;
    const outletId = req.user.id || req.body.outletId; // Assuming outlet info is in user object


    if (!washCode || !status) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        statusCode: StatusCodes.BAD_REQUEST,
        error: "Wash code and status are required",
      });
    }

    const result = await WashRequestService.updateWashStatusByCodeService(
      washCode,
      status,
      outletId,
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
    console.error("Update wash status by code error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Submit a review for a completed wash
// @route   PATCH /api/wash-requests/:id/review
// @access  Private (User only)
exports.submitWashReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        statusCode: StatusCodes.BAD_REQUEST,
        error: "Rating must be between 1 and 5",
      });
    }

    const result = await WashRequestService.submitWashReviewService(
      id,
      userId,
      rating,
      review,
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
    console.error("Submit wash review error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
