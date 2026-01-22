
const express = require("express");
const { createPaymentIntentCtrl, getKeyServiceCtrl } = require("../../controllers/stripeController");
const { authMiddleware } = require("../../middlewares/auth");
const { stripeWebhookCtrl } = require("../../webhooks/stripeWebhookController");

const router = express.Router();

router.get("/pub-key",getKeyServiceCtrl);
router.post("/create-intent",authMiddleware, createPaymentIntentCtrl);
router.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhookCtrl
);

module.exports = router;