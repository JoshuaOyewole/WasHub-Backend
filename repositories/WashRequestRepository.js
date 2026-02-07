"use strict";
const WashRequest = require("../models/WashRequest");

/**
 * WashRequest Repository - Data access layer
 * Handles all database operations for WashRequest model
 */

const WashRequestRepository = {
  // Create a new wash request
  async create(washRequestData) {
    return await WashRequest.create(washRequestData);
  },

  // Find a wash request by query
  async findOne(query) {
    return await WashRequest.findOne(query);
  },

  // Find wash request by ID
  async findById(id) {
    return await WashRequest.findById(id);
  },

  // Find wash request by wash code
  async findByWashCode(washCode) {
    return await WashRequest.findOne({ washCode });
  },

  // Find wash requests by outlet ID
  async findByOutletId(outletId) {
    return await WashRequest.find({ outletId, status: "completed" });
  },

  // Find multiple wash requests by query
  async find(query = {}, options = {}) {
    const { limit, sort, select, populate } = options;
    let dbQuery = WashRequest.find(query);

    if (select) dbQuery = dbQuery.select(select);
    if (sort) dbQuery = dbQuery.sort(sort);
    if (limit) dbQuery = dbQuery.limit(limit);
    if (populate) dbQuery = dbQuery.populate(populate);

    return await dbQuery;
  },

  // Update wash request by ID
  async updateById(id, updateData) {
    return await WashRequest.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  },

  // Delete wash request by ID
  async deleteById(id) {
    return await WashRequest.findByIdAndDelete(id);
  },

  // Count wash requests by query
  async count(query = {}) {
    return await WashRequest.countDocuments(query);
  },

  // Get wash requests with status counts
  async findWithStatusCounts(userId) {
    const requests = await WashRequest.find({ userId }).sort({ createdAt: -1 });

    // Scheduled = scheduled status
    // Ongoing = order_received, vehicle_checked, in_progress, drying_finishing, ready_for_pickup
    // Completed = completed status

    const ongoingStatuses = [
      "order_received",
      "vehicle_checked",
      "in_progress",
      "drying_finishing",
      "ready_for_pickup",
    ];

    const meta = {
      total: requests.length,
      pending: requests.filter((r) => r.status === "scheduled").length,
      ongoing: requests.filter((r) => ongoingStatuses.includes(r.status)).length,
      completed: requests.filter((r) => r.status === "completed").length,
    };

    return { requests, meta };
  },
};

module.exports = WashRequestRepository;
