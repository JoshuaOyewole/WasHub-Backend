const { StatusCodes } = require("http-status-codes");
const userService = require("../services/UserService");
const outletService = require("../services/OutletService");
const emailService = require("../services/EmailService");
const OTPService = require("../services/OTPService");
const { generateOTPValidator } = require("../validators/OTPValidator");
const jwt = require("jsonwebtoken");
const { uploadImageBuffer, deleteImageByUrl } = require("../utils/cloudinary");
const UserRepository = require("../repositories/UserRepository");



// @desc    Check if email exists
// @route   POST /api/auth/check-email
// @access  Public
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: false,
        error: "Email is required",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const result = await userService.checkEmailExistsService(email);

    if (result.data) {
      return res.status(result.statusCode).json({
        status: true,
        data: result.data,
        statusCode: result.statusCode,
      });
    }

    res.status(result.statusCode).json({
      status: false,
      error: result.message,
      statusCode: result.statusCode,
    });
  } catch (error) {
    console.error("CheckEmail controller error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      error: "Server Error",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(StatusCodes.FORBIDDEN).json({
        status: false,
        error: "Verification token is required",
        statusCode: StatusCodes.FORBIDDEN,
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.purpose !== "registration") {
      return res.status(StatusCodes.FORBIDDEN).json({
        status: false,
        error: "Invalid verification token",
        statusCode: StatusCodes.FORBIDDEN,
      });
    }

    const result = await userService.createUserService(req.body);

    if (!result.status) {
      return res.status(result.statusCode).json({
        status: result.status,
        error: result.error.message || result.error,
        data: result.error.details || null,
        statusCode: result.statusCode,
      });
    }

    res.status(result.statusCode).json({
      status: result.status,
      //token: result.data.token,
      message: "Account created Successfully!",
      statusCode: result.statusCode,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(StatusCodes.FORBIDDEN).json({
        status: error.status || false,
        error: error.message || error.error || "Verification token has expired",
        statusCode: error.statusCode || StatusCodes.FORBIDDEN,
      });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: error.status || false,
      error: error.error || "Server Error",
      statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const result = await userService.loginUserService(req.body);

    // Check if login was successful (has data property)
    if (result.data && result.data.token) {
      res.status(result.statusCode).json({
        status: result.status || true,
        statusCode: result.statusCode,
        data: { user: result.data.user, token: result.data.token },
      });
      return;
    }

    res.status(result.statusCode).json({
      status: result.status || false,
      error: result.message?.message || result.message || "Login failed",
      data: result.message?.details || null,
      statusCode: result.statusCode,
    });
  } catch (error) {
    console.error("Login controller message:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: error.status || false,
      error: error.error || "Server Error",
      statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // For JWT, logout is handled on client side by deleting the token.
    // Optionally, you can implement token blacklisting on server side.
    res.status(StatusCodes.OK).json({
      status: true,
      statusCode: StatusCodes.OK,
      message: "User logged out successfully",
    });
  } catch (error) {
    console.error("Logout controller message:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      error: error.error || error.message || "Server Error",
      statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // Call service to fetch user details
    const result = await userService.getUserByIdService(req.user.id);

    // Handle errors from service
    if (!result.data) {
      return res.status(result.statusCode).json({
        status: result.status || false,
        error: result.error || result.message || "Failed to fetch user data",
        statusCode: result.statusCode,
      });
    }

    // Return successful response
    res.status(result.statusCode).json({
      status: result.status || true,
      data: result.data,
      statusCode: result.statusCode,
    });
  } catch (error) {
    console.error("GetMe controller error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: error.status || false,
      error: error.error || "Server Error",
      statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const result = await userService.updateUserProfileService(
      req.user.id,
      req.body,
    );

    if (!result.status) {
      return res.status(result.statusCode).json({
        status: result.status || false,
        error: result.message || "Failed to update profile",
        statusCode: result.statusCode,
      });
    }

    res.status(result.statusCode).json({
      status: true,
      data: result.data,
      statusCode: result.statusCode,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("UpdateProfile controller error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      error: "Server Error",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/auth/delete-account
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const result = await userService.deleteAccountService(
      req.user.id,
      req.body?.reason,
    );

    if (!result.status) {
      return res.status(result.statusCode).json({
        status: result.status || false,
        error: result.message || "Failed to delete account",
        statusCode: result.statusCode,
      });
    }

    res.status(result.statusCode).json({
      status: true,
      message: result.message,
      statusCode: result.statusCode,
    });
  } catch (error) {
    console.error("DeleteAccount controller error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      error: "Server Error",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    /*   if (!req.user || !req.user.id) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: false,
        error: "Unauthorized",
        statusCode: StatusCodes.UNAUTHORIZED,
      });
    } */

    const { currentPassword, newPassword } = req.body;

    const result = await userService.changePasswordService(
      req.user.id,
      currentPassword,
      newPassword,
    );

    if (!result.status) {
      return res.status(result.statusCode).json({
        status: false,
        error: result.error || "Failed to change password",
        statusCode: result.statusCode,
      });
    }

    return res.status(result.statusCode).json({
      status: true,
      message: result.message,
      statusCode: result.statusCode,
    });
  } catch (error) {
    console.error("ChangePassword controller error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      error: "Server Error",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// @desc    Upload profile image
// @route   POST /api/auth/profile-image
// @access  Private
exports.uploadProfileImage = async (req, res) => {
  try {
    /*  if (!req.user || !req.user.id) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: false,
        error: "Unauthorized",
        statusCode: StatusCodes.UNAUTHORIZED,
      });
    } */

    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: false,
        error: "Image file is required",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const currentUser = await UserRepository.findById(req.user.id);
    if (currentUser?.profileImage) {
      await deleteImageByUrl(currentUser.profileImage);
    }

    const result = await uploadImageBuffer(req.file.buffer, {
      folder: process.env.CLOUDINARY_FOLDER || "users",
    });

    const updateResult = await userService.updateUserProfileService(
      req.user.id,
      { profileImage: result.secure_url },
    );

    if (!updateResult.status) {
      return res.status(updateResult.statusCode).json({
        status: false,
        error: updateResult.message || "Failed to update profile image",
        statusCode: updateResult.statusCode,
      });
    }

    return res.status(StatusCodes.OK).json({
      status: true,
      data: {
        url: result.secure_url,
        user: updateResult.data.user,
      },
      message: "Profile image uploaded",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.error("UploadProfileImage controller error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      error: "Server Error",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// @route   GET /api/auth/send-otp
// @access  Public
exports.sendOTP = async (req, res) => {
  try {
    const validation = await generateOTPValidator(req.body);
    if (!validation.isValid) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: false,
        error: validation.errors[0].message,
        statusCode: StatusCodes.BAD_REQUEST,
        //errors: validation.errors,
      });
    }
    const { email } = validation.data;
    const { otp, otpHash, expiresAt } = await OTPService.generateOTP(email);

    //save to OTP collection
    await OTPService.saveOTP(
      email,
      (OTPcategory = "email_verification"),
      otpHash,
      expiresAt,
    );

    // Send OTP via email
    await emailService.sendEmail({
      to: email,
      subject: "Your OTP Code",
      template: "sendOtp",
      data: { otp, email },
    });
    res.status(StatusCodes.OK).json({
      status: true,
      data: { emailSent: true },
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("SendOTP controller message:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      error: error.error || error.message || "Error sending OTP",
      statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// @route   GET /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  // Implementation for verifying OTP
  try {
    const { otp, email } = req.body;

    if (!otp || !email) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: false,
        error: "email and otp are required",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    const response = await OTPService.verifyOTP({ email, otp });

    if (!response.status) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: response.status || false,
        error: response.error || "Invalid or expired OTP",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    if (response.status) {
      const res = await OTPService.deleteOTP(response.hashed);

      if (!res.acknowledged) {
        return {
          status: true,
          statusCode: StatusCodes.BAD_REQUEST,
          error: "error deleting OTP",
        };
      }
    }

    const verificationToken = OTPService.generateVerificationToken({
      email,
      purpose: "registration",
    });

    return res.status(StatusCodes.OK).json({
      status: true,
      data: { verificationToken },
      statusCode: StatusCodes.OK,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("VerifyOTP controller message:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      error: "Server Error",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// @desc    Forgot Password - Send reset link
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: false,
        error: "Email is required",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const result = await userService.forgotPasswordService(email);

    if (!result.data) {
      return res.status(result.statusCode).json({
        status: false,
        error: result.message || "Failed to process request",
        statusCode: result.statusCode,
      });
    }

    // Send reset email if user exists
    if (result.data.resetToken) {
      const APP_SCHEME = process.env.APP_SCHEME || "Washub";
      const resetLink = `${APP_SCHEME}://(auth)/setupPassword?token=${result.data.resetToken}`;

      await emailService.sendEmail({
        to: email,
        subject: "Password Reset Request",
        template: "passwordReset",
        data: {
          name: result.data.user.name,
          resetLink: resetLink,
        },
      });
    }

    // Always return success to prevent email enumeration
    res.status(StatusCodes.OK).json({
      status: true,
      data: { emailSent: true },
      message: "If the email exists, a password reset link has been sent",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.error("ForgotPassword controller error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      error: "Server Error",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// @desc    Reset Password with token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: false,
        error: "Token and password are required",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const result = await userService.resetPasswordService(token, password);

    if (!result.status) {
      return res.status(result.statusCode).json({
        status: false,
        error: result.error,
        statusCode: result.statusCode,
      });
    }

    res.status(result.statusCode).json({
      status: true,
      message: "Password reset successfully",
      statusCode: result.statusCode,
    });
  } catch (error) {
    console.error("ResetPassword controller error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      error: "Server Error",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// @desc    Login outlet
// @route   POST /api/auth/outlet/login
// @access  Public
exports.outletLogin = async (req, res) => {
  try {
    console.log("Outlet login request body:", req.body);
    const result = await outletService.loginOutletService(req.body);

    // Check if login was successful (has data property)
    if (result.data && result.data.token) {
      res.status(result.statusCode).json({
        status: result.status || true,
        statusCode: result.statusCode,
        data: { outlet: result.data.outlet, token: result.data.token },
      });
      return;
    }

    res.status(result.statusCode).json({
      status: result.status || false,
      error: result.message?.message || result.message || "Login failed",
      data: result.message?.details || null,
      statusCode: result.statusCode,
    });
  } catch (error) {
    console.error("Outlet login controller error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: error.status || false,
      error: error.error || "Server Error",
      statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};
