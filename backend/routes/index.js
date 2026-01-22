const express = require("express");

const concertRoutes = require("./v1/concertRoutes");
const authRoutes = require("./v1/authRoutes")
const bookingRoutes = require("./v1/bookingRoutes");
const queueRoutes = require("./v1/queueRoutes");
const stripeRoutes = require("./v1/stripeRoutes")

const router = express.Router();

router.use("/v1/concert", concertRoutes);
router.use("/v1/auth", authRoutes);
router.use("/v1/booking",bookingRoutes);
router.use("/v1/queue",queueRoutes);
router.use('/v1/payment',stripeRoutes)
module.exports = router;