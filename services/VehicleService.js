"use strict";
const { StatusCodes } = require("http-status-codes");
const VehicleRepository = require("../repositories/VehicleRepository");

/**
 * Vehicle Service - Business logic layer
 */

exports.createVehicleService = async (body, userId) => {
  try {
    const vehicleData = {
      userId,
      vehicleType: body.vehicleType,
      vehicleMake: body.vehicleMake,
      vehicleModel: body.vehicleModel,
      vehicleYear: body.vehicleYear,
      vehicleColor: body.vehicleColor,
      plateNumber: body.plateNumber,
      image: body.image || null,
    };

    const existing = await VehicleRepository.findOne({
      userId,
      plateNumber: vehicleData.plateNumber,
    });

    if (existing) {
      return {
        error: "Vehicle with this plate number already exists",
        status: false,
        statusCode: StatusCodes.CONFLICT,
      };
    }

    const vehicle = await VehicleRepository.create(vehicleData);

    return {
      data: vehicle,
      status: true,
      message: "Vehicle created successfully",
      statusCode: StatusCodes.CREATED,
    };
  } catch (error) {
    console.error("Error creating vehicle:", error);
    return {
      error: error.message || "Failed to create vehicle",
      status: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

exports.getVehiclesService = async (userId, inWishlist) => {
  try {
    const query = { userId };

    // Add wishlist filter if provided
    if (inWishlist !== undefined) {
      query.inWishlist = inWishlist === "true" || inWishlist === true;
    }

    const vehicles = await VehicleRepository.find(query, {
      sort: { createdAt: -1 },
    });
    return {
      data: vehicles,
      status: true,
      message: "Vehicles retrieved successfully",
      statusCode: StatusCodes.OK,
    };
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return {
      error: error.message || "Failed to fetch vehicles",
      status: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

exports.getVehicleByIdService = async (id, userId) => {
  try {
    const vehicle = await VehicleRepository.findById(id);
    if (!vehicle) {
      return {
        error: "Vehicle not found",
        status: false,
        statusCode: StatusCodes.NOT_FOUND,
      };
    }

    if (!vehicle.userId.equals(userId)) {
      return {
        error: "Unauthorized to access this vehicle",
        status: false,
        statusCode: StatusCodes.FORBIDDEN,
      };
    }

    return {
      data: vehicle,
      status: true,
      message: "Vehicle retrieved successfully",
      statusCode: StatusCodes.OK,
    };
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    return {
      error: error.message || "Failed to fetch vehicle",
      status: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

exports.updateVehicleService = async (id, updateData, userId) => {
  try {
    const vehicle = await VehicleRepository.findById(id);
    if (!vehicle) {
      return {
        error: "Vehicle not found",
        status: false,
        statusCode: StatusCodes.NOT_FOUND,
      };
    }

    if (!vehicle.userId.equals(userId)) {
      return {
        error: "Unauthorized to update this vehicle",
        status: false,
        statusCode: StatusCodes.FORBIDDEN,
      };
    }

    const updated = await VehicleRepository.updateById(id, updateData);
    return {
      data: updated,
      message: "Vehicle updated successfully",
      status: true,
      statusCode: StatusCodes.OK,
    };
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return {
      error: error.message || "Failed to update vehicle",
      status: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

exports.deleteVehicleService = async (id, userId) => {
  try {
    const vehicle = await VehicleRepository.findById(id);
    if (!vehicle) {
      return {
        error: "Vehicle not found",
        status: false,
        statusCode: StatusCodes.NOT_FOUND,
      };
    }

    if (!vehicle.userId.equals(userId)) {
      return {
        error: "Unauthorized to delete this vehicle",
        status: false,
        statusCode: StatusCodes.FORBIDDEN,
      };
    }

    await VehicleRepository.deleteById(id);
    return {
      message: "Vehicle deleted successfully",
      status: true,
      statusCode: StatusCodes.OK,
    };
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return {
      error: error.message || "Failed to delete vehicle",
      status: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

exports.addToWashService = async (id, userId) => {
  try {
    const vehicle = await VehicleRepository.findById(id);
    if (!vehicle) {
      return {
        error: "Vehicle not found",
        status: false,
        statusCode: StatusCodes.NOT_FOUND,
      };
    }

    if (!vehicle.userId.equals(userId)) {
      return {
        error: "Unauthorized to modify this vehicle",
        status: false,
        statusCode: StatusCodes.FORBIDDEN,
      };
    }

    if (vehicle.inWishlist) {
      return {
        error: "Vehicle is already in My Wash",
        status: false,
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }

    const updated = await VehicleRepository.updateById(id, {
      inWishlist: true,
      wishlistAddedAt: new Date(),
    });

    return {
      data: updated,
      message: "Vehicle added to My Wash successfully",
      status: true,
      statusCode: StatusCodes.OK,
    };
  } catch (error) {
    console.error("Error adding vehicle to wash:", error);
    return {
      error: error.message || "Failed to add vehicle to wash",
      status: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

exports.removeFromWashService = async (id, userId) => {
  try {
    const vehicle = await VehicleRepository.findById(id);
    if (!vehicle) {
      return {
        error: "Vehicle not found",
        status: false,
        statusCode: StatusCodes.NOT_FOUND,
      };
    }

    if (!vehicle.userId.equals(userId)) {
      return {
        error: "Unauthorized to modify this vehicle",
        status: false,
        statusCode: StatusCodes.FORBIDDEN,
      };
    }

    if (!vehicle.inWishlist) {
      return {
        error: "Vehicle is not in My Wash",
        status: false,
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }

    const updated = await VehicleRepository.updateById(id, {
      inWishlist: false,
      wishlistAddedAt: null,
    });

    return {
      data: updated,
      message: "Vehicle removed from My Wash successfully",
      status: true,
      statusCode: StatusCodes.OK,
    };
  } catch (error) {
    console.error("Error removing vehicle from wash:", error);
    return {
      error: error.message || "Failed to remove vehicle from wash",
      status: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};
