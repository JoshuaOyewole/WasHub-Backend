const OTP = require("../models/OTP");

const OTPRepository = {
  async create(otpData) {
    return await OTP.create(otpData);
  },
  async fetchHashedOTP(email) {
    return await OTP.findOne({ email }).select("otpHash expiresAt");
  },
  async deleteOTP({ otpHash }) {
    return await OTP.deleteOne({ otpHash });
  },
};

module.exports = OTPRepository;
