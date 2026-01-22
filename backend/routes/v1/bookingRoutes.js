const express = require("express");
const { authMiddleware } = require("../../middlewares/auth");
const {
  confirmBookingCtrl,
  getPendingBookingCtrl,
  cancelPendingBookingCtrl,
  createBookingCtrl,
  getConfirmedBookingCtrl,
  getUserBookingsCtrl,
} = require("../../controllers/bookingController");
const { authLimiter } = require("../../middlewares/rateLimit");
const { validationMiddleware } = require("../../middlewares/validation");
const { bookingSchema } = require("../../utils/schema");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  authLimiter,
  validationMiddleware(bookingSchema),
  createBookingCtrl,
);

router.patch("/:id/confirm", authMiddleware, confirmBookingCtrl);
router.get("/confirmed/:bookingId", authMiddleware, getConfirmedBookingCtrl);
router.get("/mine", authMiddleware, getUserBookingsCtrl);
router.get("/pending", authMiddleware, getPendingBookingCtrl);
router.delete("/pending", authMiddleware, cancelPendingBookingCtrl);

module.exports = router;
