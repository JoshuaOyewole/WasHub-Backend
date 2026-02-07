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
