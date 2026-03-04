const { StatusCodes } = require("http-status-codes");
const OutletService = require("../services/OutletService");

// @desc Create a new outlet
// @route POST /api/outlets
// @access Private (Admin)
exports.createOutlet = async (req, res) => {
  try {
    const result = await OutletService.createOutletService(req.body);

    if (!result.status) {
      return res.status(result.statusCode).json({
        status: result.status,
        error: result.error,
        statusCode: result.statusCode,
      });
    }

    res.status(result.statusCode).json({
      status: result.status,
      data: result.data,
      message: result.message,
      statusCode: result.statusCode,
    });
  } catch (error) {
    console.error("Create outlet error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      error: "Internal server error",
    });
  }
};

// @desc Get all outlets
// @route GET /api/outlets?city=Lagos&state=Lagos&search=eko
// @access Public
exports.getOutlets = async (req, res) => {
  try {
    const { city, state, search } = req.query;
    const filters = { city, state, search };

    const result = await OutletService.getOutletsService(filters);

    if (!result.status) {
      return res.status(result.statusCode).json({
        status: result.status,
        error: result.error,
        statusCode: result.statusCode,
      });
    }

    res.status(result.statusCode).json({
      status: result.status,
      data: result.data.outlets,
      message: result.message,
      statusCode: result.statusCode,
    });
  } catch (error) {
    console.error("Get outlets error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      error: "Internal server error",
    });
  }
};


exports.searchOutletByAddress = async (req, res) => {
  const { address, page, limit } = req.query;

  if (!address) {
    return res.status(400).json({
      status: false,
      errorCode: "MISSING_ADDRESS",
      error: "Address is required",
      statusCode: 400,
    });
  }

  try {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));

    const result = await OutletService.searchOutletsByAddress(address, {
      page: pageNum,
      limit: limitNum,
    });

    return res.json({
      status: true,
      data: result.outlets,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
      geocoded: result.geocoded,
      statusCode: 200,
      message: result.outlets.length
        ? "Outlets found"
        : "No outlets found for this location",
    });
  } catch (error) {
    // Distinguish geocoding failures from server errors
    const isGeoError = error.message?.includes("not found in Nigeria") ||
                       error.message?.includes("Address is required");
    const statusCode = isGeoError ? 404 : 500;
    const errorCode = isGeoError ? "GEOCODE_FAILED" : "INTERNAL_ERROR";

    return res.status(statusCode).json({
      status: false,
      errorCode,
      error: error.message,
      statusCode,
    });
  }
}

// @desc Get single outlet by ID
// @route GET /api/outlets/:id
// @access Public
exports.getOutletById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await OutletService.getOutletByIdService(id);

    if (!result.status) {
      return res.status(result.statusCode).json({
        status: result.status,
        error: result.error,
        statusCode: result.statusCode,
      });
    }

    res.status(result.statusCode).json({
      status: result.status,
      data: result.data,
      message: result.message,
      statusCode: result.statusCode,
    });
  } catch (error) {
    console.error("Get outlet error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      error: "Internal server error",
    });
  }
};

// @desc Update outlet
// @route PATCH /api/outlets/:id
// @access Private (Admin)
exports.updateOutlet = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await OutletService.updateOutletService(id, req.body);

    if (!result.status) {
      return res.status(result.statusCode).json({
        status: result.status,
        error: result.error,
        statusCode: result.statusCode,
      });
    }

    res.status(result.statusCode).json({
      status: result.status,
      data: result.data,
      message: result.message,
      statusCode: result.statusCode,
    });
  } catch (error) {
    console.error("Update outlet error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      error: "Internal server error",
    });
  }
};

// @desc Delete outlet
// @route DELETE /api/outlets/:id
// @access Private (Admin)
exports.deleteOutlet = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await OutletService.deleteOutletService(id);

    if (!result.status) {
      return res.status(result.statusCode).json({
        status: result.status,
        error: result.error,
        statusCode: result.statusCode,
      });
    }

    res.status(result.statusCode).json({
      status: result.status,
      message: result.message,
      statusCode: result.statusCode,
    });
  } catch (error) {
    console.error("Delete outlet error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      error: "Internal server error",
    });
  }
};

// @desc Get nearby outlets based on user location
// @route GET /api/outlets/nearby?lat=6.5244&lng=3.3792&radius=5000
// @access Private (User)
exports.getOutletNearby = async (req, res) => {
console.log("Received request for nearby outlets with query:", req.query);
  try {
    const { lat, lng, radius } = req.query; 
   if(!lat || !lng || !radius) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: false,
        error: "Latitude, longitude and radius are required",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    };

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusNum = parseFloat(radius);
    
    const result = await OutletService.getOutletNearbyService(latNum, lngNum, radiusNum);

    if (!result.status) {
      return res.status(result.statusCode).json({
        status: result.status,
        error: result.error,
        statusCode: result.statusCode,
      });
    }

    res.status(result.statusCode).json({
      status: result.status,
      data: result.data,
      message: result.message,
      statusCode: result.statusCode,
    });
  } catch (error) {
    console.error("Get nearby outlets error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      error: "Internal server error",
    });
  }
};
