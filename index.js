const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
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

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/wash-requests", washRequestRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.get("/", (req, res) => {
  res.send("Welcome to the API");
});

//Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Get your endpoint online
/* 
 ngrok.connect({ addr: PORT, authtoken_from_env: true })
	.then(listener => console.log(`Ingress established at: ${listener.url()}`));
 // console.log(`http://localhost:${PORT}`);
 */
