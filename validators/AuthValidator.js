"use strict";
const helpers = require("../utils/helpers");
const Joi = require("joi");

const { validate } = helpers;

/**
 * Validate user registration data
 * @param {Object} body - Request body
 * @returns {Object} - Validation result
 */

const createUserValidator = async (body) => {
  const schema = Joi.object({
    firstname: Joi.string().min(2).max(50).required().trim().messages({
      "string.min": "Firstname must be at least 2 characters long",
      "string.max": "Firstname cannot exceed 50 characters",
      "any.required": "Firstname is required",
    }),
    lastname: Joi.string().min(2).max(50).required().trim().messages({
      "string.min": "Lastname must be at least 2 characters long",
      "string.max": "Lastname cannot exceed 50 characters",
      "any.required": "Lastname is required",
    }),
    phoneNumber: Joi.string().min(11).max(14).required().trim().messages({
      "string.min": "Phone number must be at least 11 characters long",
      "string.max": "Phone number cannot exceed 14 characters",
      "any.required": "Phone number is required",
    }),
    email: Joi.string().email().required().trim().lowercase().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    
    /*  dob: Joi.date().optional().messages({
      "date.base": "Date of Birth must be a valid date",
    }),
    profile_picture: Joi.string().uri().optional().messages({
      "string.uri": "Profile Image must be a valid URL",
    }), */
    password: Joi.string()
      .min(6)
      .max(20)
      .required()
      .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)"))
      .messages({
        "string.min": "Password must be at least 6 characters long",
        "string.max": "Password cannot exceed 20 characters",
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        "any.required": "Password is required",
      }),
    role: Joi.string().valid("user", "admin").default("user").messages({
      "any.only": "Role must be either user or admin",
    }),
    /*   
  addresses: Joi.array()
      .items(Joi.string().min(2).max(100).trim())
      .optional()
      .messages({
        "string.min": "Address must be at least 2 characters long",
        "string.max": "Address cannot exceed 100 characters",
      }), */
  });

  return validate(schema, body);
};
const loginUserValidator = async (body) => {
  const schema = Joi.object({
    email: Joi.string().email().required().trim().lowercase().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(6).required().messages({
      "string.min": "Password must be at least 6 characters long",
      "any.required": "Password is required",
    }),
  });

  return validate(schema, body);
};

module.exports = {
  createUserValidator,
  loginUserValidator,
};
