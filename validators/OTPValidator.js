"use strict";
const helpers = require("../utils/helpers");
const Joi = require("joi");

const { validate } = helpers;


const generateOTPValidator = async (body) => {
  const schema = Joi.object({
    email: Joi.string().email().min(2).max(50).required().trim().messages({
      "string.min": "email must be at least 2 characters long",
      "string.max": "email cannot exceed 50 characters",
      "any.required": "email is required",
    }),
  });

  return validate(schema, body);
};

module.exports = {
  generateOTPValidator, 
};
