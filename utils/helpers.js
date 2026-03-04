"use strict";
const crypto = require("crypto");
const paymentService = require("../services/paymentService");
const  {OAuth2Client} = require("google-auth-library");


const client = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);

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

async function verifyGoogleIdToken(idToken) {
  if (!idToken) {
    throw new Error("ID token is required");
  }
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_WEB_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload) {
      return null;
    }
    
    return payload;
  }
  catch (error) {
    console.error("Google ID token verification error:", error);
    return null;
  }
}

const saveTransactionIntentWithRetry = async (
  intent,
  retriesLeft = 2,
  delayMs = 1000,
) => {
  try {
    await paymentService.saveTransactionIntent(intent);
  } catch (saveError) {
    if (retriesLeft <= 0) {
      console.error("save transaction intent error:", saveError);
      return;
    }

    setTimeout(() => {
      saveTransactionIntentWithRetry(intent, retriesLeft - 1, delayMs * 2);
    }, delayMs);
  }
};
module.exports = {
  validate,
  generateOTP,
  verifyGoogleIdToken,
  saveTransactionIntentWithRetry,
};
