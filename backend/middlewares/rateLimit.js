const rateLimit = require("express-rate-limit");

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too Many Requests",
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
});

module.exports = { globalRateLimiter, authLimiter };

