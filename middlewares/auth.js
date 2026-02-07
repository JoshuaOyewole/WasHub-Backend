const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const mongoose = require("mongoose");
const Outlet = require("../models/Outlet");

// In-memory cache for user/outlet data (TTL: 60 seconds)
const authCache = new Map();
const CACHE_TTL = 60000; // 60 seconds

// Cache cleanup - runs every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of authCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      authCache.delete(key);
    }
  }
}, 120000);

// Optimized token verification with caching
function verifyToken(tokenValue) {
  try {
    const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET);
    return decoded || null;
  } catch (error) {
    return null;
  }
}

// Optimized RBAC with caching and lean queries
async function rbac(token, accountType, decodedToken = null) {
  const VALID_ACCOUNT_TYPES = ["admin", "userOrOutletOrAdmin", "user", "outlet"];
  
  // Early validation
  if (!VALID_ACCOUNT_TYPES.includes(accountType)) {
    console.error(`Invalid account type: ${accountType}`);
    return {
      status: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      error: "Internal server error",
    };
  }

  if (!token) {
    return {
      status: false,
      statusCode: StatusCodes.UNAUTHORIZED,
      error: "Token not provided",
    };
  }

  try {
    // Use provided decoded token or decode new one
    const authorized = decodedToken || verifyToken(token);

    if (!authorized || !authorized.id) {
      return {
        status: false,
        statusCode: StatusCodes.UNAUTHORIZED,
        error: "Unauthorized, error verifying token",
      };
    }

    // Check cache first
    const cacheKey = `${authorized.id}_${accountType}`;
    const cached = authCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return { status: true, user: cached.user };
    }

    let accountUser = null;

    // Optimized database queries with lean() for performance
    if (accountType === "outlet") {
      accountUser = await Outlet.findOne({
        _id: authorized.id,
        role: "outlet",
      })
        .select("_id email role name location")
        .lean()
        .exec();
    } else if (accountType === "userOrOutletOrAdmin") {
      // Try User collection first (most common case)
      accountUser = await User.findOne({
        _id: authorized.id,
        role: { $in: ["admin", "user"] },
      })
        .select("_id email role firstName lastName")
        .lean()
        .exec();

      // Fallback to Outlet collection if not found in User
      if (!accountUser) {
        accountUser = await Outlet.findOne({
          _id: authorized.id,
          role: "outlet",
        })
          .select("_id email role name location")
          .lean()
          .exec();
      }
    } else {
      // Admin or User lookup
      accountUser = await User.findOne({
        _id: authorized.id,
        role: accountType,
      })
        .select("_id email role firstName lastName")
        .lean()
        .exec();
    }

    if (!accountUser) {
      return {
        status: false,
        statusCode: StatusCodes.UNAUTHORIZED,
        error: `Access denied, not ${
          accountType === "admin"
            ? "an admin"
            : accountType === "user"
              ? "a user"
              : accountType === "outlet"
                ? "an outlet"
                : "a user, outlet, or admin"
        }`,
      };
    }

    // Cache the result
    authCache.set(cacheKey, {
      user: accountUser,
      timestamp: Date.now(),
    });

    return { status: true, user: accountUser };
  } catch (error) {
    console.error(`RBAC error:`, error.message);
    return {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      error: "Internal server error",
    };
  }
}

exports.getTokenFromHeaders = (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: false,
        statusCode: StatusCodes.UNAUTHORIZED,
        error: "Access token is required.",
      });
    }

    // Decode token once and cache in request object
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: false,
        statusCode: StatusCodes.UNAUTHORIZED,
        error: "Invalid or expired token.",
      });
    }

    req.token = token;
    req.decodedToken = decoded; // Cache decoded token for reuse
    next();
  } catch (error) {
    console.error("Token extraction error:", error.message);
    return res.status(StatusCodes.UNAUTHORIZED).json({
      status: false,
      statusCode: StatusCodes.UNAUTHORIZED,
      error: "Token validation failed.",
    });
  }
};

exports.adminOnly = async (req, res, next) => {
  const authorized = await rbac(req.token, "admin", req.decodedToken);

  if (!authorized.status) {
    return res.status(authorized.statusCode || StatusCodes.UNAUTHORIZED).json({
      status: false,
      statusCode: authorized.statusCode || StatusCodes.UNAUTHORIZED,
      error: authorized.error,
    });
  }

  req.user = {
    id: authorized.user._id,
    role: authorized.user.role,
    email: authorized.user.email,
  };
  next();
};

exports.userOrOutletOrAdmin = async (req, res, next) => {
  const authorized = await rbac(req.token, "userOrOutletOrAdmin", req.decodedToken);

  if (!authorized.status) {
    return res.status(authorized.statusCode || StatusCodes.UNAUTHORIZED).json({
      status: false,
      statusCode: authorized.statusCode || StatusCodes.UNAUTHORIZED,
      error: authorized.error,
    });
  }

  req.user = {
    id: authorized.user._id,
    role: authorized.user.role,
    email: authorized.user.email,
  };
  next();
};

exports.userOnly = async (req, res, next) => {
  const authorized = await rbac(req.token, "user", req.decodedToken);

  if (!authorized.status) {
    return res.status(authorized.statusCode || StatusCodes.UNAUTHORIZED).json({
      status: false,
      statusCode: authorized.statusCode || StatusCodes.UNAUTHORIZED,
      error: authorized.error,
    });
  }

  req.user = {
    id: authorized.user._id,
    role: authorized.user.role,
    email: authorized.user.email,
  };
  next();
};

exports.outletOnly = async (req, res, next) => {
  const authorized = await rbac(req.token, "outlet", req.decodedToken);

  if (!authorized.status) {
    return res.status(authorized.statusCode || StatusCodes.UNAUTHORIZED).json({
      status: false,
      statusCode: authorized.statusCode || StatusCodes.UNAUTHORIZED,
      error: authorized.error,
    });
  }

  req.user = {
    id: authorized.user._id,
    role: authorized.user.role,
    email: authorized.user.email,
  };
  next();
};
