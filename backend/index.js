require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { globalRateLimiter } = require("./middlewares/rateLimit.js");
const errorHandler = require("./middlewares/errorHandler.js");
const routes = require("./routes/index.js")
const logger = require("./config/logger.js");
const app = express();
const dotenv = require('dotenv');
const { cleanExpiredBookings } = require("./services/bookingService.js");
dotenv.config();

app.use(helmet());           // Adds security headers
app.use(cors());             // Enables Cross-Origin Resource Sharing
app.use(express.json());     // Allows the server to parse JSON request bodies
app.use(globalRateLimiter);
app.use(errorHandler);  // Centralized error handling
app.use(express.urlencoded({ extended: true }));


app.use("/api", routes);


setInterval(cleanExpiredBookings, 60*1000); // Clean expired bookings every 60 seconds
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});