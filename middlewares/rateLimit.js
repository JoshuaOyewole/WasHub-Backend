"use strict";

/**
 * Simple in-memory sliding-window rate limiter.
 * Use this for API routes that call external services (e.g. geocoding).
 *
 * Usage:
 *   const { rateLimit } = require("../middlewares/rateLimit");
 *   router.get("/search", rateLimit({ windowMs: 60_000, max: 30 }), controller);
 */

const buckets = new Map();

function rateLimit({ windowMs = 60_000, max = 30, message } = {}) {
  return (req, res, next) => {
    // Key by authenticated user ID or IP
    const key = req.user?.id || req.ip;
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { hits: [], blockedUntil: 0 };
      buckets.set(key, bucket);
    }

    // Purge expired hits
    bucket.hits = bucket.hits.filter((ts) => now - ts < windowMs);

    if (bucket.hits.length >= max) {
      const retryAfter = Math.ceil(
        (bucket.hits[0] + windowMs - now) / 1000
      );
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        status: false,
        errorCode: "RATE_LIMITED",
        error:
          message ||
          `Too many requests. Please try again in ${retryAfter} seconds.`,
        statusCode: 429,
      });
    }

    bucket.hits.push(now);
    next();
  };
}

// Periodic cleanup every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    bucket.hits = bucket.hits.filter((ts) => now - ts < 120_000);
    if (bucket.hits.length === 0) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref();

module.exports = { rateLimit };
