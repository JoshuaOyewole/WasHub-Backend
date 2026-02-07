"use strict";
const { StatusCodes } = require("http-status-codes");
const OutletRepository = require("../repositories/OutletRepository");
const jwt = require("jsonwebtoken");

/**
 * Outlet Service - Business logic layer
 */

exports.createOutletService = async (body) => {
  try {
    const outletData = {
      name: body.name,
      location: body.location,
      address: body.address,
      city: body.city,
      state: body.state,
      phoneNumber: body.phoneNumber,
      email: body.email,
      image: body.image,
      rating: body.rating,
      workingHours: body.workingHours,
      services: body.services,
      pricing: body.pricing || {
        quickWash: 2500,
        basic: 5000,
        premium: 8500,
      },
    };

    // Check if outlet with same name and location exists
    const existing = await OutletRepository.findOne({
      name: outletData.name,
      location: outletData.location,
    });

    if (existing) {
      return {
        error: "Outlet with this name and location already exists",
        status: false,
        statusCode: StatusCodes.CONFLICT,
      };
    }

    const outlet = await OutletRepository.create(outletData);

    return {
      data: outlet,
      status: true,
      message: "Outlet created successfully",
      statusCode: StatusCodes.CREATED,
    };
  } catch (error) {
    console.error("Error creating outlet:", error);
    return {
      error: error.message || "Failed to create outlet",
      status: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};
/**
 * Authenticate outlet login
 * @param {Object} body - Request body containing login credentials
 * @returns {Promise<Object>} - Service response object
 */
exports.loginOutletService = async (body) => {
  try {
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return {
        message: {
          message: "Email and password are required",
        },
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }

    // Find outlet by email with password field
    const outlet = await OutletRepository.findOne({ email }, "+password");

    if (!outlet) {
      return {
        message: {
          message: "Invalid credentials",
          field: "email",
        },
        statusCode: StatusCodes.UNAUTHORIZED,
      };
    }

    // Verify password
    const isPasswordValid = await outlet.matchPassword(password);

    if (!isPasswordValid) {
      return {
        message: "Invalid credentials",
        statusCode: StatusCodes.UNAUTHORIZED,
        status: false,
      };
    }

    // Generate JWT token
    const token = generateOutletToken(outlet);

    // Prepare outlet response data
    const outletResponse = {
      outletId: outlet._id,
      name: outlet.name,
      email: outlet.email,
      role: outlet.role,
      location: outlet.location,
      city: outlet.city,
      state: outlet.state,
    };

    return {
      data: {
        outlet: outletResponse,
        token: token,
      },
      statusCode: StatusCodes.OK,
    };
  } catch (error) {
    console.error("An unknown error occurred while logging in outlet:", error);
    return {
      message: {
        message: "Internal server error occurred during login",
        details: error.message,
      },
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

/**
 * Generate JWT token for outlet
 * @param {Object} outlet - Outlet object with id, role, etc.
 * @returns {String} - JWT token
 * @private
 */
const generateOutletToken = (outlet) => {
  return jwt.sign(
    {
      id: outlet._id || outlet.id,
      role: outlet.role,
      email: outlet.email,
      name: outlet.name,
      outletId: outlet._id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || "7d",
      algorithm: "HS256",
    },
  );
};

exports.generateOutletTokenService = generateOutletToken;
exports.getOutletsService = async (filters = {}) => {
  try {
    const query = { isActive: true };

    // Add optional filters
    if (filters.city) {
      query.city = filters.city;
    }
    if (filters.state) {
      query.state = filters.state;
    }
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { location: { $regex: filters.search, $options: "i" } },
        { address: { $regex: filters.search, $options: "i" } },
      ];
    }

    const outlets = await OutletRepository.find(query, {
      sort: { createdAt: -1 },
    });

    return {
      data: { outlets },
      status: true,
      message: "Outlets retrieved successfully",
      statusCode: StatusCodes.OK,
    };
  } catch (error) {
    console.error("Error fetching outlets:", error);
    return {
      error: error.message || "Failed to fetch outlets",
      status: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

exports.getOutletByIdService = async (id) => {
  try {
    const outlet = await OutletRepository.findById(id);

    if (!outlet) {
      return {
        error: "Outlet not found",
        status: false,
        statusCode: StatusCodes.NOT_FOUND,
      };
    }

    return {
      data: outlet,
      status: true,
      message: "Outlet retrieved successfully",
      statusCode: StatusCodes.OK,
    };
  } catch (error) {
    console.error("Error fetching outlet:", error);
    return {
      error: error.message || "Failed to fetch outlet",
      status: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

exports.updateOutletService = async (id, body) => {
  try {
    const outlet = await OutletRepository.findById(id);

    if (!outlet) {
      return {
        error: "Outlet not found",
        status: false,
        statusCode: StatusCodes.NOT_FOUND,
      };
    }

    // Update only provided fields
    const updateData = {};
    const allowedFields = [
      "name",
      "location",
      "address",
      "city",
      "state",
      "phoneNumber",
      "email",
      "image",
      "rating",
      "activeWashes",
      "workingHours",
      "services",
      "pricing",
      "isActive",
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const updatedOutlet = await OutletRepository.update(id, updateData);

    return {
      data: updatedOutlet,
      status: true,
      message: "Outlet updated successfully",
      statusCode: StatusCodes.OK,
    };
  } catch (error) {
    console.error("Error updating outlet:", error);
    return {
      error: error.message || "Failed to update outlet",
      status: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

exports.deleteOutletService = async (id) => {
  try {
    const outlet = await OutletRepository.findById(id);

    if (!outlet) {
      return {
        error: "Outlet not found",
        status: false,
        statusCode: StatusCodes.NOT_FOUND,
      };
    }

    await OutletRepository.delete(id);

    return {
      status: true,
      message: "Outlet deleted successfully",
      statusCode: StatusCodes.OK,
    };
  } catch (error) {
    console.error("Error deleting outlet:", error);
    return {
      error: error.message || "Failed to delete outlet",
      status: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};
