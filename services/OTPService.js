const { StatusCodes } = require("http-status-codes");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const OTPRepository = require("../repositories/OTPRepository");
const jwt = require("jsonwebtoken");
const OTPService = {
  generateOTP: async () => {
    try {
      // Generate OTP (e.g., 6 digits)
      const otp = crypto.randomInt(100000, 999999).toString();
      // Hash before saving (to prevent leaks if DB is compromised)
      const otpHash = await bcrypt.hash(otp, 10);
      // const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
      const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes from now
      return {
        otp,
        otpHash,
        expiresAt: otpExpiry,
      };
    } catch (error) {
      return {
        message: {
          message: "Error generating OTP",
          details: error.message,
        },
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      };
    }
  },

  generateVerificationToken: ({ email, purpose }) => {
    const verificationToken = jwt.sign(
      {
        email,
        purpose,
      },
      process.env.JWT_SECRET,
      { expiresIn: "10m" },
    );
    return verificationToken;
  },
  saveOTP: async (email, OTPcategory, otpHash, expiresAt) => {
    try {
      const otpRecord = await OTPRepository.create({
        email,
        OTPcategory,
        otpHash,
        expiresAt,
      });

      return otpRecord;
    } catch (error) {
      console.error("Error saving OTP:", error);
      throw new Error("Error saving OTP");
    }
  },

  deleteOTP: async (otpHash) => {
    try {
      return await OTPRepository.deleteOTP({ otpHash });
    } catch (error) {
      console.error("Error deleting OTP", error);
      throw new Error("error deleting OTP");
    }
  },

  verifyOTP: async ({ email, otp }) => {
    try {
      const res = await OTPRepository.fetchHashedOTP(email);

      if (!res) {
        return {
          status: false,
          message: "OTP not found",
          statusCodes: StatusCodes.BAD_REQUEST,
        };
      }

      if (res.expiresAt && Date.now() > res.expiresAt) {
        await OTPService.deleteOTP(res.otpHash);

        return {
          status: false,
          statusCode: StatusCodes.UNAUTHORIZED,
          message: "OTP expired",
        };
      }

      const isValid = await bcrypt.compare(otp, res.otpHash);

      if (!isValid) {
        return {
          status: isValid,
          statusCode: StatusCodes.UNAUTHORIZED,
          message: "Invalid or expired OTP",
        };
      }

      return {
        status: isValid,
        hashed: res.otpHash,
      };
    } catch (error) {
      console.error("Error verifying OTP:", error);
      throw new Error("Error verifying OTP");
    }
  },
};

module.exports = OTPService;
