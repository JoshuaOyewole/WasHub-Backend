const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const multer = require("multer");
const { StatusCodes } = require("http-status-codes");
require("dotenv").config();
const app = express();
//const ngrok = require("@ngrok/ngrok");

// Database connection
const connectDB = require("./database/db");
connectDB();

//Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require("./routes/auth");
const washRequestRoutes = require("./routes/washRequest");
const vehicleRoutes = require("./routes/vehicle");
const outletRoutes = require("./routes/outlet");

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/wash-requests", washRequestRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/outlets", outletRoutes);
app.get("/", (req, res) => {
  res.send("Welcome to the API");
});

// Global error handler (incl. multer file validation errors)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: false,
      error: err.message || "File upload error",
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  if (err?.message === "Only JPG and PNG images are allowed") {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: false,
      error: err.message,
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: false,
    error: err?.message || "Server Error",
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
  });
});

//Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
 //  ngrok
  //.connect({ addr: PORT, authtoken_from_env: true })
  //.then((listener) =>
    //console
      //.log(`Ingress established at: ${listener.url()}`)) 
});


