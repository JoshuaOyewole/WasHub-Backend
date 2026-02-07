"use strict";
const Outlet = require("../models/Outlet");

/**
 * Outlet Repository - Database operations layer
 */

exports.create = async (data) => {
  return await Outlet.create(data);
};

exports.find = async (query, options = {}) => {
  const { sort = { createdAt: -1 }, select = null, populate = null } = options;
  
  let queryBuilder = Outlet.find(query).sort(sort);
  
  if (select) {
    queryBuilder = queryBuilder.select(select);
  }
  
  if (populate) {
    queryBuilder = queryBuilder.populate(populate);
  }
  
  return await queryBuilder;
};

exports.findOne = async (query, selectFields = null) => {
  if (selectFields) {
    return await Outlet.findOne(query).select(selectFields);
  }
  return await Outlet.findOne(query);
};

exports.findById = async (id) => {
  return await Outlet.findById(id);
};

exports.update = async (id, data) => {
  return await Outlet.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

exports.delete = async (id) => {
  return await Outlet.findByIdAndDelete(id);
};

exports.count = async (query) => {
  return await Outlet.countDocuments(query);
};
