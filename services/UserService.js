"use strict";
const { StatusCodes } = require("http-status-codes");
const UserRepository = require("../repositories/UserRepository");
const {
  loginUserValidator,
  createUserValidator,
} = require("../validators/AuthValidator");
const jwt = require("jsonwebtoken");
const { generateOTP } = require("../utils/helpers");

/**
 * User Service - Business logic layer
 * Handles user-related business operations
 */

/**
 * Create a new user
 * @param {Object} body - Request body containing user data
 * @returns {Promise<Object>} - Service response object
 */
exports.createUserService = async (body) => {
  try {
    // Validate input data
    const validation = await createUserValidator(body);

    if (!validation.isValid) {
      return {
        message: {
          message: validation.errors[0].message,
          details: validation.errors,
        },
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }

    const { email } = validation.data;

    // Check if user already exists
    const existingUser = await UserRepository.findOne({ email });

    if (existingUser) {
      return {
        message: "User with this email already exists",
        statusCode: StatusCodes.CONFLICT,
      };
    }

    // Create new user
    const userData = {
      firstname: validation.data.firstname,
      lastname: validation.data.lastname,
      phoneNumber: validation.data.phoneNumber,
      email: validation.data.email,
      password: validation.data.password,
      role: validation.data.role,
    };

    const response = await UserRepository.create(userData);

    // Generate JWT token
    //const token = generateTokenService.generateToken(user);

    // Prepare user response data
    //const userResponse = {
    // userId: user._id,
    //role: user.role,
    //createdAt: user.createdAt,
    //};
    generateOTP;
    return {
      data: response,
      statusCode: StatusCodes.CREATED,
    };
  } catch (error) {
    console.error("An unknown error occurred while creating user:", error);
    return {
      message: {
        message: "Internal server error occurred while creating user",
        details: error.message,
      },
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

/**
 * Authenticate user login
 * @param {Object} body - Request body containing login credentials
 * @returns {Promise<Object>} - Service response object
 */
exports.loginUserService = async (body) => {
  try {
    // Validate input data
    const validation = await loginUserValidator(body);
    if (!validation.isValid) {
      return {
        message: {
          message: validation.errors[0].message,
          details: validation.errors,
        },
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }

    const { email, password } = validation.data;

    // Find user by email
    const user = await UserRepository.findOne({ email });

    if (!user) {
      return {
        message: {
          message: "Invalid credentials",
          field: "email",
        },
        statusCode: StatusCodes.UNAUTHORIZED,
      };
    }

    // Verify password
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      return {
        message: "Invalid credentials",
        statusCode: StatusCodes.UNAUTHORIZED,
        status: false,
      };
    }

    // Generate JWT token
    const token = generateToken(user);

    // Prepare user response data
    const userResponse = {
      userId: user._id,
      name: user.firstname,
      email: user.email,
      role: user.role,
      profile_picture: user?.profile_picture ?? null,
    };

  

    return {
      data: {
        user: userResponse,
        token: token,
      },
      statusCode: StatusCodes.OK,
    };
  } catch (error) {
    console.error("An unknown error occurred while logging in:", error);
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
 * Generate JWT token for user
 * @param {Object} user - User object with id, role, etc.
 * @returns {String} - JWT token
 * @private
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || "1d",
      algorithm: "HS256",
    },
  );
};

exports.generateTokenService = generateToken;

/**
 * Get user by ID (for /me endpoint)
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - Service response object
 */
exports.getUserByIdService = async (userId) => {
  try {
    // Fetch user from repository
    const user = await UserRepository.findById(userId);

    if (!user) {
      return {
        message: "User not found",
        statusCode: StatusCodes.NOT_FOUND,
      };
    }

    // Prepare sanitized user response (exclude sensitive fields)
    const userResponse = {
      userId: user._id,
      name: `${user.firstname} ${user.lastname}`,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      profile_picture: user?.profile_picture,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Add role-specific fields if needed
    if (user.role === "talent") {
      userResponse.location = user.location;
      userResponse.skills = user.skills;
    }

    return {
      data: {
        user: userResponse,
      },
      statusCode: StatusCodes.OK,
    };
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return {
      message: "Internal server error occurred while fetching user",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

/**
 * Check if email already exists
 * @param {String} email - Email to check
 * @returns {Promise<Object>} - Service response object
 */
exports.checkEmailExistsService = async (email) => {
  try {
    if (!email) {
      return {
        message: "Email is required",
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }

    // Check if user exists with this email
    const existingUser = await UserRepository.findOne({ email });

    return {
      data: {
        exists: !!existingUser,
        email: email,
      },
      statusCode: StatusCodes.OK,
    };
  } catch (error) {
    console.error("Error checking email existence:", error);
    return {
      message: "Internal server error occurred while checking email",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

module.exports = {
  ...exports,
};
