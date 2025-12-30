const logger = require("../config/logger");
const {
  createBooking,
  confirmBooking,
  getPendingBookings,
  cancelPendingBooking,
} = require("../services/bookingService");

const createBookingCtrl = async (req, res) => {
  try {
    const booking = await createBooking(req.user.userId, req.body);
    res.json(booking);
  } catch (err) {
    logger.error("Create booking error", {
      error: err?.stack || err.message || err,
    });
    const status =
      err?.name == "ValidationError" ||
      err?.name == "PrismaClientValidationError"
        ? 400
        : 500;
    res.status(status).json({ error: err?.message || "Internal server error" });
  }
};

const confirmBookingCtrl = async (req, res) => {
  try {
    const result = await confirmBooking(req.params.id, req.user.userId);
    res.json(result);
  } catch (err) {
    logger.error("Confirm booking error", {
      error: err?.stack || err.message || err,
    });
    const status =
      err?.name == "ValidationError" ||
      err?.name == "PrismaClientValidationError"
        ? 400
        : 500;
    res.status(status).json({ error: err?.message || "Internal server error" });
  }
};

const getPendingBookingCtrl = async (req, res) => {
  try {
    let { categoryId } = req.query;
    if (!categoryId) {
      return res.status(400).json({
        error: "Category ID Required",
      });
    }

    categoryId = String(categoryId).trim();
    const pending = await getPendingBookings(req.user.userId, categoryId);
    res.json(pending || null);
  } catch (err) {
    logger.error("Get pending error", {
      message: err.message,
      name: err.name,
      stack: err.stack,
      categoryId: req.query.categoryId,
    });
    const status =
      err?.name == "ValidationError" ||
      err?.name == "PrismaClientValidationError"
        ? 400
        : 500;
    res.status(status).json({ error: err?.message || "Internal server error" });
  }
};

const cancelPendingBookingCtrl = async (req, res) => {
  const { categoryId } = req.query;
  if (!categoryId) {
    return res.status(400).json({
      error: "Category ID Required",
    });
  }

  try {
    categoryId = String(categoryId).trim();
    const result = await cancelPendingBooking(req.user.userId, categoryId);
    res.json(result);
  } catch (err) {
    logger.error("Cancel pending error", {
      message: err.message,
      name: err.name,
      stack: err.stack,
      categoryId: req.query.categoryId,
    });
    const status =
      err?.name == "ValidationError" ||
      err?.name == "PrismaClientValidationError"
        ? 400
        : 500;
    res.status(status).json({ error: err?.message || "Internal server error" });
  }
};


module.exports = {
  createBookingCtrl, confirmBookingCtrl,getPendingBookingCtrl,cancelPendingBookingCtrl
}
