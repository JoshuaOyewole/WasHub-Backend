"use strict";
const { StatusCodes } = require("http-status-codes");
const WashRequestRepository = require("../repositories/WashRequestRepository");
const { generateWashCode } = require("../utils/washCodeGenerator");

/**
 * WashRequest Service - Business logic layer
 * Handles wash request-related business operations
 */

/**
 * Create a new wash request
 * @param {Object} body - Request body containing wash request data
 * @param {String} userId - User ID from authenticated user
 * @returns {Promise<Object>} - Service response object
 */
exports.createWashRequestService = async (body, vehicle, userId) => {
  try {
    const vehicleDetails = {
      vehicleType: vehicle.vehicleType,
      vehicleMake: vehicle.vehicleMake,
      vehicleModel: vehicle.vehicleModel,
      licensePlate: vehicle.plateNumber,
      vehicleColor: vehicle.vehicleColor || "Not specified",
      image: vehicle.image || null,
    };

    // Generate unique wash code
    let washCode;
    let isUnique = false;
    while (!isUnique) {
      washCode = generateWashCode();
      const existing = await WashRequestRepository.findByWashCode(washCode);
      if (!existing) {
        isUnique = true;
      }
    }

    const washRequestData = {
      userId,
      vehicleId: body.vehicleId,
      serviceName: body.serviceName,
      serviceType: body.serviceType,
      outletId: body.outletId,
      outletName: body.outletName,
      outletLocation: body.outletLocation,
      vehicleInfo: vehicleDetails,
      price: body.price,
      paymentStatus: body.paymentStatus || "pending",
      notes: body.notes ?? null,
      washCode: washCode,
      status: "scheduled",
      statusTimeline: [
        {
          status: "scheduled",
          timestamp: new Date(),
          updatedBy: "system",
        },
      ],
    };

    const washRequest = await WashRequestRepository.create(washRequestData);

    return {
      status: true,
      data: washRequest,
      message: "Wash request created successfully",
      statusCode: StatusCodes.CREATED,
    };
  } catch (error) {
    console.error("Error creating wash request:", error);
    return {
      error: error.message || "Failed to create wash request",
      status: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

/**
 * Get all wash requests for a user
 * @param {String} userId - User ID from authenticated user
 * @param {String} status - Optional status filter
 * @returns {Promise<Object>} - Service response object
 */
exports.getWashRequestsService = async (userId, status = null) => {
  try {
    const query = { userId };

    // Add status filter if provided
    const validStatuses = [
      "scheduled",
      "order_received",
      "vehicle_checked",
      "in_progress",
      "drying_finishing",
      "ready_for_pickup",
      "completed",
      "cancelled",
    ];

    if (status && validStatuses.includes(status)) {
      query.status = status;
    }

    // Get requests with status counts
    const { requests, meta } =
      await WashRequestRepository.findWithStatusCounts(userId);

    // Filter by status if provided
    const filteredRequests = status
      ? requests.filter((r) => r.status === status)
      : requests;

    return {
      data: filteredRequests,
      meta,
      message: "Wash requests retrieved successfully",
      statusCode: StatusCodes.OK,
    };
  } catch (error) {
    console.error("Error fetching wash requests:", error);
    return {
      error: {
        message: error.message || "Failed to fetch wash requests",
        details: error,
      },
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

/**
 * Get a single wash request by ID
 * @param {String} requestId - Wash request ID
 * @param {String} userId - User ID from authenticated user
 * @returns {Promise<Object>} - Service response object
 */
exports.getWashRequestByIdService = async (requestId, userId) => {
  try {
    const washRequest = await WashRequestRepository.findById(requestId);

    if (!washRequest) {
      return {
        error: { message: "Wash request not found" },
        statusCode: StatusCodes.NOT_FOUND,
      };
    }

    // Verify the request belongs to the user
    if (!washRequest.userId.equals(userId)) {
      return {
        error: { message: "Unauthorized to access this wash request" },
        statusCode: StatusCodes.FORBIDDEN,
      };
    }

    return {
      data: washRequest,
      message: "Wash request retrieved successfully",
      statusCode: StatusCodes.OK,
    };
  } catch (error) {
    console.error("Error fetching wash request:", error);
    return {
      error: {
        message: error.message || "Failed to fetch wash request",
        details: error,
      },
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

/**
 * Update wash request status
 * @param {String} requestId - Wash request ID
 * @param {Object} updateData - Data to update
 * @param {String} userId - User ID from authenticated user
 * @returns {Promise<Object>} - Service response object
 */
exports.updateWashRequestService = async (requestId, updateData, userId) => {
  try {
    const washRequest = await WashRequestRepository.findById(requestId);

    if (!washRequest) {
      return {
        error: { message: "Wash request not found" },
        statusCode: StatusCodes.NOT_FOUND,
      };
    }

    // Verify the request belongs to the user
    if (!washRequest.userId.equals(userId)) {
      return {
        error: { message: "Unauthorized to update this wash request" },
        statusCode: StatusCodes.FORBIDDEN,
      };
    }

    const updatedRequest = await WashRequestRepository.updateById(
      requestId,
      updateData,
    );

    return {
      data: updatedRequest,
      message: "Wash request updated successfully",
      statusCode: StatusCodes.OK,
    };
  } catch (error) {
    console.error("Error updating wash request:", error);
    return {
      error: {
        message: error.message || "Failed to update wash request",
        details: error,
      },
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

/**
 * Update wash request status with validation for valid transitions
 * @param {String} requestId - Wash request ID
 * @param {String} newStatus - New status to set
 * @returns {Promise<Object>} - Service response object
 */
exports.updateWashRequestStatusService = async (requestId, newStatus) => {
  try {
    const washRequest = await WashRequestRepository.findById(requestId);

    if (!washRequest) {
      return {
        error: { message: "Wash request not found" },
        statusCode: StatusCodes.NOT_FOUND,
      };
    }

    // Validate status transitions
    const validTransitions = {
      pending: ["ongoing", "cancelled"],
      ongoing: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    const currentStatus = washRequest.status;
    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      return {
        error: {
          message: `Invalid status transition from ${currentStatus} to ${newStatus}`,
        },
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }

    const updateData = { status: newStatus };
    
    // Set timestamp based on new status
    if (newStatus === "completed") {
      updateData.completedAt = new Date();
    } else if (newStatus === "cancelled") {
      updateData.cancelledAt = new Date();
    }

    const updatedRequest = await WashRequestRepository.updateById(
      requestId,
      updateData,
    );

    return {
      data: updatedRequest,
      message: `Wash request status updated to ${newStatus}`,
      statusCode: StatusCodes.OK,
    };
  } catch (error) {
    console.error("Error updating wash request status:", error);
    return {
      error: {
        message: error.message || "Failed to update wash request status",
        details: error,
      },
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

/**
 * Delete/Cancel wash request
 * @param {String} requestId - Wash request ID
 * @param {String} userId - User ID from authenticated user
 * @returns {Promise<Object>} - Service response object
 */
exports.deleteWashRequestService = async (requestId, userId) => {
  try {
    const washRequest = await WashRequestRepository.findById(requestId);

    if (!washRequest) {
      return {
        error: { message: "Wash request not found" },
        statusCode: StatusCodes.NOT_FOUND,
      };
    }

    // Verify the request belongs to the user
    if (!washRequest.userId.equals(userId)) {
      return {
        error: { message: "Unauthorized to delete this wash request" },
        statusCode: StatusCodes.FORBIDDEN,
      };
    }

    // Instead of deleting, mark as cancelled
    const cancelledRequest = await WashRequestRepository.updateById(requestId, {
      status: "cancelled",
      cancelledAt: new Date(),
    });

    return {
      data: cancelledRequest,
      message: "Wash request cancelled successfully",
      statusCode: StatusCodes.OK,
    };
  } catch (error) {
    console.error("Error deleting wash request:", error);
    return {
      error: {
        message: error.message || "Failed to delete wash request",
        details: error,
      },
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

/**
 * Verify wash code (for outlets/agents)
 * @param {String} washCode - 5-digit wash code
 * @returns {Promise<Object>} - Service response object
 */
exports.verifyWashCodeService = async (washCode) => {
  try {
    const washRequest = await WashRequestRepository.findByWashCode(washCode);

    if (!washRequest) {
      return {
        error: { message: "Invalid wash code" },
        statusCode: StatusCodes.NOT_FOUND,
      };
    }

    // Check if wash is already completed or cancelled
    if (washRequest.status === "completed" || washRequest.status === "cancelled") {
      return {
        error: { message: `This wash is already ${washRequest.status}` },
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }

    return {
      data: washRequest,
      message: "Wash code verified successfully",
      statusCode: StatusCodes.OK,
    };
  } catch (error) {
    console.error("Error verifying wash code:", error);
    return {
      error: {
        message: error.message || "Failed to verify wash code",
        details: error,
      },
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

/**
 * Update wash status (for outlets/agents)
 * @param {String} washCode - 5-digit wash code
 * @param {String} newStatus - New status to set
 * @param {String} outletId - Outlet ID performing the update
 * @returns {Promise<Object>} - Service response object
 */
exports.updateWashStatusByCodeService = async (washCode, newStatus, outletId) => {
  try {
    const washRequest = await WashRequestRepository.findByWashCode(washCode);

    if (!washRequest) {
      return {
        error: { message: "Invalid wash code" },
        statusCode: StatusCodes.NOT_FOUND,
      };
    }

    // Verify the outlet owns this wash request
    if (!washRequest.outletId.equals(outletId)) {
      return {
        error: { message: "Unauthorized to update this wash request" },
        statusCode: StatusCodes.FORBIDDEN,
      };
    }

    // Define valid status progression
    const statusOrder = [
      "scheduled",
      "order_received",
      "vehicle_checked",
      "in_progress",
      "drying_finishing",
      "ready_for_pickup",
      "completed",
    ];

    const currentIndex = statusOrder.indexOf(washRequest.status);
    const newIndex = statusOrder.indexOf(newStatus);

    // Validate status transition (can only move forward, one step at a time or jump to completed)
    if (newIndex <= currentIndex && newStatus !== "completed") {
      return {
        error: {
          message: `Cannot move backwards from ${washRequest.status} to ${newStatus}`,
        },
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }

    if (newIndex > currentIndex + 1 && newStatus !== "completed") {
      return {
        error: {
          message: `Cannot skip steps. Current status: ${washRequest.status}, requested: ${newStatus}`,
        },
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }

    // Update status and add to timeline
    const updateData = {
      status: newStatus,
      currentStep: newIndex,
      $push: {
        statusTimeline: {
          status: newStatus,
          timestamp: new Date(),
          updatedBy: "outlet",
        },
      },
    };

    if (newStatus === "completed") {
      updateData.completedAt = new Date();
    }

    const updatedRequest = await WashRequestRepository.updateById(
      washRequest._id,
      updateData,
    );

    return {
      data: updatedRequest,
      message: `Wash status updated to ${newStatus}`,
      statusCode: StatusCodes.OK,
    };
  } catch (error) {
    console.error("Error updating wash status:", error);
    return {
      error: {
        message: error.message || "Failed to update wash status",
        details: error,
      },
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

/**
 * Submit a review for a completed wash request
 * @param {String} washRequestId - Wash request ID
 * @param {String} userId - User ID
 * @param {Number} rating - Rating (1-5)
 * @param {String} review - Optional review text
 * @returns {Promise<Object>} - Service response object
 */
exports.submitWashReviewService = async (
  washRequestId,
  userId,
  rating,
  review,
) => {
  try {
    const Outlet = require("../models/Outlet");

    // Find the wash request
    const washRequest = await WashRequestRepository.findById(washRequestId);

    if (!washRequest) {
      return {
        error: { message: "Wash request not found" },
        statusCode: StatusCodes.NOT_FOUND,
      };
    }

    // Verify the wash request belongs to the user
    if (!washRequest.userId.equals(userId)) {
      return {
        error: { message: "Unauthorized to review this wash" },
        statusCode: StatusCodes.FORBIDDEN,
      };
    }

    // Verify the wash is completed
    if (washRequest.status !== "completed") {
      return {
        error: { message: "Can only review completed washes" },
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }

    // Check if already reviewed
    if (washRequest.userRating) {
      return {
        error: { message: "You have already reviewed this wash" },
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }

    // Update wash request with review
    const updatedRequest = await WashRequestRepository.updateById(
      washRequestId,
      {
        userRating: rating,
        userReview: review || null,
        reviewedAt: new Date(),
      },
    );

    // Update outlet's average rating
    const outlet = await Outlet.findById(washRequest.outletId);
    if (outlet) {
      // Get all completed wash requests for this outlet that have ratings
      const allWashRequests = await WashRequestRepository.findByOutletId(
        washRequest.outletId,
      );
      const ratedWashes = allWashRequests.filter((wash) => wash.userRating);

      if (ratedWashes.length > 0) {
        const totalRating = ratedWashes.reduce(
          (sum, wash) => sum + wash.userRating,
          0,
        );
        const averageRating = totalRating / ratedWashes.length;

        // Update outlet rating (rounded to 1 decimal)
        await Outlet.findByIdAndUpdate(washRequest.outletId, {
          rating: Math.round(averageRating * 10) / 10,
        });
      }
    }

    return {
      data: updatedRequest,
      message: "Review submitted successfully",
      statusCode: StatusCodes.OK,
    };
  } catch (error) {
    console.error("Error submitting wash review:", error);
    return {
      error: {
        message: error.message || "Failed to submit review",
        details: error,
      },
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};
