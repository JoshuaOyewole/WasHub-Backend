const { StatusCodes } = require("http-status-codes");
const userService = require("../services/UserService");
const emailService = require("../services/EmailService");
const OTPService = require("../services/OTPService");
const { generateOTPValidator } = require("../validators/OTPValidator");
const jwt = require("jsonwebtoken");
// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    console.log("payload", payload);
    if (payload.purpose !== "registration") {
      return res.status(StatusCodes.FORBIDDEN).json({
        status: false,
        message: "Invalid verification token",
        statusCode: StatusCodes.FORBIDDEN,
      });
    }

    const result = await userService.createUserService(req.body);

    if (result.error) {
      return res.status(result.statusCode).json({
        status: false,
        message: result.error.message || result.error,
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
        message: error.message,
      });
    }
    console.error("Register controller message:", JSON.stringify(error));
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Server Error",
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const result = await userService.loginUserService(req.body);

    if (result.status) {
      return res.status(result.statusCode).json({
        status: false,
        message: result.error.message,
        errors: result.error.details || null,
        statusCode: result.statusCode,
      });
    }

    res.status(result.statusCode).json({
      status: true,
      token: result.data.token,
      data: result.data.user,
    });
  } catch (error) {
    console.error("Login controller message:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Server Error",
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

    const response = await OTPService.verifyOTP({ email, otp });

    if (!response.status) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: false,
        message: response.message,
      });
    }

    if (response.status) {
      const res = await OTPService.deleteOTP(response.hashed);

      if (!res.acknowledged) {
        return {
          status: true,
          statusCode: StatusCodes.BAD_REQUEST,
          message: "error deleting OTP",
        };
      }
    }

    const verificationToken = OTPService.generateVerificationToken({
      email,
      purpose: "registration",
    });

    return res.status(StatusCodes.OK).json({
      status: true,
      statusCode: StatusCodes.OK,
      message: "OTP verified successfully",
      verificationToken,
    });
  } catch (error) {
    console.error("VerifyOTP controller message:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Server Error",
    });
  }
};
