"use strict";
const { StatusCodes } = require("http-status-codes");
const WashRequestRepository = require("../repositories/WashRequestRepository");

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
      image: vehicle.image || null,
    };
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
    if (status && ["pending", "ongoing", "completed"].includes(status)) {
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
    if (washRequest.userId.toString() !== userId) {
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
    if (washRequest.userId.toString() !== userId) {
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
    if (washRequest.userId.toString() !== userId) {
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
