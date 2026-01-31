const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const mongoose = require("mongoose");

// Protect routes

async function verifyToken(tokenVaue) {
  try {
    const decoded = jwt.verify(tokenVaue, process.env.JWT_SECRET);
    //console.log("Token Decoded - User Found:", decoded);
    if (decoded) return decoded;
  } catch (error) {
    return null;
  }
}

async function rbac(token, accountType) {
  const accountTypes = ["admin", "userOrAdmin", "user"];
  if (!accountTypes.includes(accountType)) {
    console.error(
      `Invalid account type provided for authorization: ${accountType}`
    );
    return {
      status:false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      error: "Internal server error",
    };
  }

  try {
    if (!token) {
      console.log("Token not provided for authorization.");
      return { status: false, statusCode: StatusCodes.UNAUTHORIZED, error: "Token not provided" };
    }

    const authorized = await verifyToken(token);
  
    //let user = await fetchUser(authorized.id);
    let user = null;

    if (!authorized) {
      return {
        status: false,
        statusCode: StatusCodes.UNAUTHORIZED,
        error: "Unauthorized, error verifying token",
      };
    }

    if (accountType) {
      const accountUser = await User.findOne({
        _id: authorized.id,
        role:
          accountType === "userOrAdmin"
            ? { $in: ["admin", "user"] }
            : accountType,
      });

      if (!accountUser) {
        console.log(`Unauthorized ${accountType} access attempt detected.`);
        return {
          status: false,
          statusCode: StatusCodes.UNAUTHORIZED,
          error: `"Access denied, not" ${
            accountType == "admin"
              ? "an admin"
              : accountType === "user"
              ? "a user"
              : "a user or admin"
          }`,
        };
      }

      user = accountUser;
    }

    return { status: true, user };
  } catch (error) {
    console.error(`Error in authorize By AccountType: ${error.error}`);
    return {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      error: "Internal server error",
    };
  }
}

exports.getTokenFromHeaders = (req, res, next) => {
  let token;
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // Set token from Bearer token in header
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      // Set token from cookie
      token = req.cookies.token;
    }
    // Make sure token exists
    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: false,
        statusCode: StatusCodes.UNAUTHORIZED,
        error: "Access token is required.",
      });
    }
    //add the token to req object
    req.token = token;
    next();
  } catch (error) {
    throw new Error(`Error in protect middleware: ${error.error}`);
  }
};

exports.adminOnly = async (req, res, next) => {
  const token = req.token;

  const authorized = await rbac(token, "admin");

  if (!authorized.status) {
    console.log("Unauthorized admin access attempt detected.:", authorized);
    return res.status(StatusCodes.UNAUTHORIZED).json({
      status: false,
      statusCode: StatusCodes.UNAUTHORIZED,
      error: authorized.error,
    });
  }
  req.user = { id: new mongoose.Types.ObjectId(authorized.user._id) };
  next();
};

exports.userOrAdmin = async (req, res, next) => {
  const token = req.token;

  const authorized = await rbac(token, "userOrAdmin");

  if (!authorized.status) {
  
    return res.status(StatusCodes.UNAUTHORIZED).json({
      status: false,
      statusCode: authorized.statusCode || StatusCodes.UNAUTHORIZED,
      error: authorized.error || authorized.message || "Unauthorized access",
    });
  }
  req.user = { id: new mongoose.Types.ObjectId(authorized.user._id) };
  next();
};
exports.userOnly = async (req, res, next) => {
  const token = req.token;

  const authorized = await rbac(token, "user");


  if (!authorized.status) {
    console.error("Unauthorized user access attempt detected.", authorized);
    return res.status(StatusCodes.UNAUTHORIZED).json({
      status: false,
      statusCode: StatusCodes.UNAUTHORIZED,
      error: authorized.error || authorized.message || "Unauthorized access",
    });
  }
  req.user = { id: new mongoose.Types.ObjectId(authorized.user._id) };
  next();
};
