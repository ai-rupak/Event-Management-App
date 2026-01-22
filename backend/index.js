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
const { promoteUsers,cleanExpiredSlots } = require("./services/queueService.js");
const { SINGLE_CONCERT_ID } = require("./config/constants.js");
dotenv.config();

app.use(helmet());           // Adds security headers
app.use(cors());             // Enables Cross-Origin Resource Sharing
app.use(express.json());     // Allows the server to parse JSON request bodies
app.use(globalRateLimiter);
app.use(errorHandler);  // Centralized error handling
app.use(express.urlencoded({ extended: true }));


app.use("/api", routes);


setInterval(cleanExpiredBookings, 60*1000); // Clean expired bookings every 60 seconds

setInterval(() => {
  promoteUsers(SINGLE_CONCERT_ID);
}, 5000);

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   logger.info(`Server is running on port ${PORT}`);
// });

app.listen(3000, () => {
  console.log("Server running on port 3000");

  // Queue worker (DEV / SINGLE INSTANCE)
  setInterval( async() => {
    await promoteUsers(SINGLE_CONCERT_ID);
    await cleanExpiredSlots(SINGLE_CONCERT_ID)
      .catch(err => console.error("Queue worker error", err));
  }, 5000);
});