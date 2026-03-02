"use strict";

const axios = require("axios");

// ─── In-memory LRU cache ──────────────────────────────────────────────
class LRUCache {
  constructor(maxSize = 500, ttlMs = 24 * 60 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }

  _normalizeKey(key) {
    return key.toLowerCase().trim().replace(/\s+/g, " ");
  }

  get(key) {
    const k = this._normalizeKey(key);
    const entry = this.cache.get(k);
    if (!entry) return null;
    if (Date.now() - entry.ts > this.ttlMs) {
      this.cache.delete(k);
      return null;
    }
    // Move to end (most-recently used)
    this.cache.delete(k);
    this.cache.set(k, entry);
    return entry.value;
  }

  set(key, value) {
    const k = this._normalizeKey(key);
    if (this.cache.has(k)) this.cache.delete(k);
    if (this.cache.size >= this.maxSize) {
      // Evict oldest (first key)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(k, { value, ts: Date.now() });
  }
}

// ─── Geocoding provider interface ─────────────────────────────────────

/**
 * Google Maps Geocoding provider (default).
 * Restrict results to Nigeria with `components=country:NG`.
 */
class GoogleGeocodingProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.url = "https://maps.googleapis.com/maps/api/geocode/json";
  }

  /**
   * Geocode an address string.
   * @param {string} address
   * @returns {Promise<{ lat: number, lng: number, types: string[], formattedAddress: string } | null>}
   */
  async geocode(address) {
    const resp = await axios.get(this.url, {
      params: {
        address,
        key: this.apiKey,
        components: "country:NG", // restrict to Nigeria
      },
      timeout: 5000,
    });

    const results = resp.data?.results;
    if (!results || results.length === 0) return null;

    const first = results[0];

    // Extra safety: if the country component isn't NG, discard
    const countryComp = first.address_components?.find((c) =>
      c.types.includes("country")
    );
    if (countryComp && countryComp.short_name !== "NG") {
      return null;
    }

    return {
      lat: first.geometry.location.lat,
      lng: first.geometry.location.lng,
      types: first.types || [],
      formattedAddress: first.formatted_address || "",
    };
  }
}

// ─── Retry helper with exponential backoff ────────────────────────────
async function withRetry(fn, { maxRetries = 2, baseDelayMs = 300 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      // Don't retry client errors (4xx) except 429 (rate limit)
      const status = err.response?.status;
      if (status && status >= 400 && status < 500 && status !== 429) throw err;

      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

// ─── Singleton service ────────────────────────────────────────────────
const geocodeCache = new LRUCache(500, 24 * 60 * 60 * 1000); // 24h TTL

let provider = null;

function getProvider() {
  if (!provider) {
    const apiKey = process.env.GOOGLE_GEOCODE_API_KEY;
    if (!apiKey)
      throw new Error("GOOGLE_GEOCODE_API_KEY env variable is required");
    provider = new GoogleGeocodingProvider(apiKey);
  }
  return provider;
}

/**
 * Swap the geocoding provider at runtime (useful for testing or migration).
 * The replacement must implement `.geocode(address)`.
 */
function setProvider(customProvider) {
  provider = customProvider;
}

// Broad type classification constants
const BROAD_TYPES = [
  "locality",
  "administrative_area_level_1",
  "administrative_area_level_2",
  "administrative_area_level_3",
  "political",
  "sublocality",
  "sublocality_level_1",
  "neighborhood",
];

const PRECISE_TYPES = ["street_address", "premise", "route", "intersection"];

/**
 * Geocode an address with caching, retry/backoff, and radius inference.
 *
 * @param {string} address
 * @returns {Promise<{ lat: number, lng: number, radiusKm: number, types: string[], formattedAddress: string }>}
 * @throws {Error} when address cannot be resolved within Nigeria
 */
async function geocode(address) {
  if (!address || !address.trim()) {
    throw new Error("Address is required");
  }

  // Check cache
  const cached = geocodeCache.get(address);
  if (cached) return cached;

  // Call provider with retry
  const result = await withRetry(() => getProvider().geocode(address));

  if (!result) {
    throw new Error("Address not found in Nigeria");
  }

  // Determine radius based on type specificity
  let radiusKm = 5; // default for precise addresses
  const isPrecise = result.types.some((t) => PRECISE_TYPES.includes(t));
  const isBroad = result.types.some((t) => BROAD_TYPES.includes(t));

  if (!isPrecise && isBroad) {
    radiusKm = 15; // wider for area-level queries like "Ikeja"
  }

  const enriched = { ...result, radiusKm };

  // Cache it
  geocodeCache.set(address, enriched);

  return enriched;
}

module.exports = {
  geocode,
  setProvider,
  getProvider,
  GoogleGeocodingProvider,
  LRUCache,
  // Expose for testing
  _cache: geocodeCache,
};
