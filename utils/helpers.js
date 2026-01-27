"use strict";
const crypto = require("crypto");

/**
 * Validate request body against Joi schema
 * @param {Object} schema - Joi schema object
 * @param {Object} body - Request body to validate
 * @returns {Object} - Validation result
 */
const validate = async (schema, body) => {
  try {
    const { error, value } = schema.validate(body, {
      abortEarly: false, // Include all errors
      allowUnknown: false, // Don't allow unknown fields
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return {
        isValid: false,
        errors: errors,
        data: null,
      };
    }

    return {
      isValid: true,
      errors: null,
      data: value,
    };
  } catch (err) {
    return {
      isValid: false,
      errors: [{ field: "general", message: "Validation error occurred" }],
      data: null,
    };
  }
};

function generateOTP(length = 6) {
  const digits = "0123456789";
  let otp = "";

  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[bytes[i] % digits.length];
  }

  return otp;
}

module.exports = {
  validate,
  generateOTP,
};
