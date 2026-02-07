"use strict";
const User = require("../models/User");

/**
 * User Repository - Data access layer
 * Handles all database operations for User model
 */

const UserRepository = {
  // Create a new user
  async create(userData) {
    return await User.create(userData);
  },
  //Find a user by query
  async findOne(query) {
    return await User.findOne(query).select("+password");
  },

  //Find user by ID
  async findById(id) {
    return await User.findById(id);
  },
  //Find user by ID with password
  async findByIdWithPassword(id) {
    return await User.findById(id).select("+password");
  },

  // Find multiple users by query
  async find(query = {}, options = {}) {
    const { limit, sort, select } = options;
    let dbQuery = User.find(query);

    if (select) dbQuery = dbQuery.select(select);
    if (sort) dbQuery = dbQuery.sort(sort);
    if (limit) dbQuery = dbQuery.limit(limit);

    return await dbQuery;
  },
  // Update user by ID
  async updateById(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  },
  // Delete user by ID
  async deleteById(id) {
    return await User.findByIdAndDelete(id);
  },
};

module.exports = UserRepository;
