"use strict";
const Outlet = require("../models/Outlet");

/**
 * Outlet Repository - Database operations layer
 */

exports.create = async (data) => {
  return await Outlet.create(data);
};

exports.findNearby = async (lat, lng, radius) => {
  const radiusInMeters = radius || 5000; // default to 5km if not provided
  return await Outlet.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
        $maxDistance: radiusInMeters,
      },
    },
  });
};

/**
 * Search outlets using $geoNear + text/regex address match.
 * Returns deduplicated, paginated results sorted by distance.
 *
 * @param {[number, number]} coords  - [lng, lat]
 * @param {number} radiusKm          - search radius in km
 * @param {string} searchQuery       - address search text
 * @param {{ page?: number, limit?: number }} pagination
 * @returns {Promise<{ outlets: Array, total: number, page: number, limit: number }>}
 */
exports.searchOutlets = async (
  coords,
  radiusKm,
  searchQuery,
  { page = 1, limit = 20 } = {},
) => {
  const radiusInMeters = radiusKm * 1000;
  const skip = (page - 1) * limit;

  // Escape regex special characters for safe anchored regex
  const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // ─── Pipeline 1: $geoNear (must be first stage, cannot be in $facet) ──
  const geoResults = await Outlet.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: coords },
        distanceField: "distance",
        maxDistance: radiusInMeters,
        spherical: true,
      },
    },
    { $limit: 200 }, // cap to avoid scanning the entire collection
  ]);

  // ─── Pipeline 2: text/regex address + name match ──────────────────────
  const textResults = await Outlet.aggregate([
    {
      $match: {
        $or: [
          { address: { $regex: escapedQuery, $options: "i" } },
          { name: { $regex: escapedQuery, $options: "i" } },
        ],
      },
    },
    { $addFields: { distance: null } },
    { $limit: 200 },
  ]);

  // ─── Merge & deduplicate (geo results take priority for distance) ─────
  const seen = new Map();

  for (const doc of geoResults) {
    seen.set(doc._id.toString(), doc);
  }
  for (const doc of textResults) {
    const id = doc._id.toString();
    if (!seen.has(id)) {
      seen.set(id, doc);
    }
  }

  // Sort: outlets with a distance first (ascending), then nulls
  const combined = Array.from(seen.values()).sort((a, b) => {
    if (a.distance != null && b.distance != null)
      return a.distance - b.distance;
    if (a.distance != null) return -1;
    if (b.distance != null) return 1;
    return 0;
  });

  const total = combined.length;
  const outlets = combined.slice(skip, skip + limit);

  return { outlets, total, page, limit };
};

// Keep legacy method for backward compat
exports.findOutletsWithinRadius = async (coords, radiusKm, searchQuery) => {
  const result = await exports.searchOutlets(coords, radiusKm, searchQuery);
  return result.outlets;
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
