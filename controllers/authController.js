const { StatusCodes } = require("http-status-codes");
const userService = require("../services/UserService");
const emailService = require("../services/EmailService");
const OTPService = require("../services/OTPService");
const { generateOTPValidator } = require("../validators/OTPValidator");
const jwt = require("jsonwebtoken");

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

    if (result.error) {
      return res.status(result.statusCode).json({
        status: false,
        error: result.error.message || result.error,
        errors: result.error.details || null,
        statusCode: result.statusCode,
      });
    }

    res.status(result.statusCode).json({
      status: true,
      //token: result.data.token,
      message: "Account created Successfully!",
      statusCode: result.statusCode,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(StatusCodes.FORBIDDEN).json({
        status: false,
        error: error.message,
        statusCode: StatusCodes.FORBIDDEN,
      });
    }
    console.error("Register controller message:", JSON.stringify(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      error: "Server Error",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
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
        status: true,
        statusCode: result.statusCode,
        data: { user: result.data.user, token: result.data.token },
      });
      return;
    }

    res.status(result.statusCode).json({
      status: false,
      error: result.message?.message || result.message || "Login failed",
      errors: result.message?.details || null,
      statusCode: result.statusCode,
    });
  } catch (error) {
    console.error("Login controller message:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      error: "Server Error",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
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
      message: "User logged out successfully",
    });
  } catch (error) {
    console.error("Logout controller message:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Server Error",
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // req.user is set by auth middleware
    if (!req.user || !req.user.id) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: false,
        message: "Unauthorized",
        statusCode: StatusCodes.UNAUTHORIZED,
      });
    }

    // Call service to fetch user details
    const result = await userService.getUserByIdService(req.user.id);

    // Handle errors from service
    if (!result.data) {
      return res.status(result.statusCode).json({
        status: false,
        message: result.message,
        statusCode: result.statusCode,
      });
    }

    // Return successful response
    res.status(result.statusCode).json({
      status: true,
      data: result.data,
      statusCode: result.statusCode,
    });
  } catch (error) {
    console.error("GetMe controller error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Server Error",
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
        message: validation.errors[0].message,
        statusCode: StatusCodes.BAD_REQUEST,
        //errors: validation.errors,
      });
    }
    const { email } = validation.data;
    const { otp, otpHash, expiresAt } = await OTPService.generateOTP(email);

    //save to OTP collection
    const result = await OTPService.saveOTP(
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
      emailSent: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("SendOTP controller message:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: error.message || "Error sending OTP",
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
        status: false,
        error: response.message,
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
