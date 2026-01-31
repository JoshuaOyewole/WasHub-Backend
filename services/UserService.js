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
        error:validation.errors[0].message,
        data: {
          message: validation.errors[0].message,
          details: validation.errors,
        },
        status:false,
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }

    const { email } = validation.data;

    // Check if user already exists
    const existingUser = await UserRepository.findOne({ email });

    if (existingUser) {
      return {
        status:false,
        error: "User with this email already exists",
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
      status:true,
      data: response,
      statusCode: StatusCodes.CREATED,
    };
  } catch (error) {
    console.error("An unknown error occurred while creating user:", error);
    return {
      status:false,
      error:error.error || "Internal server error occurred while creating user",
      data: {
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

/**
 * Initiate forgot password process
 * @param {String} email - User email
 * @returns {Promise<Object>} - Service response object
 */
exports.forgotPasswordService = async (email) => {
  try {
    if (!email) {
      return {
        message: "Email is required",
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }

    // Check if user exists with this email
    const user = await UserRepository.findOne({ email });

    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      return {
        data: {
          emailSent: true,
          email: email,
        },
        statusCode: StatusCodes.OK,
      };
    }

    // Generate reset token
    const resetToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        purpose: "password-reset",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "10m", // Token expires in 10 minutes
      },
    );

    return {
      data: {
        emailSent: true,
        email: email,
        resetToken: resetToken,
        user: {
          name: user.firstname,
        },
      },
      statusCode: StatusCodes.OK,
    };
  } catch (error) {
    console.error("Error in forgot password service:", error);
    return {
      message: "Internal server error occurred while processing request",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

/**
 * Reset user password with token
 * @param {String} token - Reset token
 * @param {String} newPassword - New password
 * @returns {Promise<Object>} - Service response object
 */
exports.resetPasswordService = async (token, newPassword) => {
  try {
    if (!token || !newPassword) {
      return {
        status: false,
        error: "Token and new password are required",
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }

    // Validate password length
    if (newPassword.length < 6) {
      return {
        status: false,
        error: "Password must be at least 6 characters long",
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return {
          status: false,
          error: "Reset token has expired. Please request a new one.",
          statusCode: StatusCodes.FORBIDDEN,
        };
      }
      return {
        status: false,
        error: "Invalid reset token",
        statusCode: StatusCodes.FORBIDDEN,
      };
    }

    // Check token purpose
    if (decoded.purpose !== "password-reset") {
      return {
        status: false,
        error: "Invalid reset token",
        statusCode: StatusCodes.FORBIDDEN,
      };
    }

    // Find user
    const user = await UserRepository.findById(decoded.id);

    if (!user) {
      return {
        status: false,
        error: "User not found",
        statusCode: StatusCodes.NOT_FOUND,
      };
    }

    // Update password (the User model's pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    return {
      status: true,
      data: {
        message: "Password reset successfully",
      },
      statusCode: StatusCodes.OK,
    };
  } catch (error) {
    console.error("Error in reset password service:", error);
    return {
      status: false,
      error: "Internal server error occurred while resetting password",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
};

module.exports = {
  ...exports,
};
