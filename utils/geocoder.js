const NodeGeocoder = require("node-geocoder");

const options = {
  provider: "google",
  apiKey: process.env.GOOGLE_GEOCODE_API_KEY,
  formatter: null,
};

const geocoder = NodeGeocoder(options);

module.exports = geocoder;