/**
 * Generate a unique 5-digit wash code
 * @returns {String} - 5-digit wash code
 */
exports.generateWashCode = () => {
  // Generate a random 5-digit number
  const code = Math.floor(10000 + Math.random() * 90000).toString();
  return code;
};

/**
 * Validate wash code format
 * @param {String} code - Wash code to validate
 * @returns {Boolean} - True if valid
 */
exports.isValidWashCode = (code) => {
  return /^\d{5}$/.test(code);
};
