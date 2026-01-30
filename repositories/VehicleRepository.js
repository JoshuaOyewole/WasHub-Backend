"use strict";
const Vehicle = require("../models/Vehicle");

/**
 * Vehicle Repository - Data access layer
 */

const VehicleRepository = {
  async create(data) {
    return await Vehicle.create(data);
  },

  async findOne(query) {
    return await Vehicle.findOne(query);
  },

  async findById(id) {
    return await Vehicle.findById(id);
  },

  async find(query = {}, options = {}) {
    const { limit, sort, select } = options;
    let dbQuery = Vehicle.find(query);

    if (select) dbQuery = dbQuery.select(select);
    if (sort) dbQuery = dbQuery.sort(sort);
    if (limit) dbQuery = dbQuery.limit(limit);

    return await dbQuery;
  },

  async updateById(id, updateData) {
    return await Vehicle.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  },

  async deleteById(id) {
    return await Vehicle.findByIdAndDelete(id);
  },

  async countByUser(userId) {
    return await Vehicle.countDocuments({ userId });
  },
};

module.exports = VehicleRepository;
