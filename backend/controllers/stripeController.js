const logger = require("../config/logger");
const redis = require("../config/redis");
const { getPendingBookings } = require("../services/bookingService");
const { createPaymentIntentService } = require("../services/paymentService");
const ACTIVE_KEY = (concertId) => `active:concert:${concertId}`;

const getKeyServiceCtrl = async (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
};

const createPaymentIntentCtrl = async (req, res) => {
try {
    const userId = req.user.userId;
    const { bookingId } = req.body;

    const booking = await getPendingBookings( userId,bookingId);

    if (!booking) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired booking",
      });
    }

    const clientSecret = await createPaymentIntentService(userId, booking);

    res.json({
  success: true,
  paymentIntentClientSecret: clientSecret.clientSecret,
});

  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

module.exports = { createPaymentIntentCtrl, getKeyServiceCtrl };
