const stripe = require("../config/stripe");
const { PrismaClient } = require("@prisma/client");
const { confirmBooking, expireBooking } = require("../services/bookingService");
const logger = require("../config/logger");

const prisma = new PrismaClient();

const stripeWebhookCtrl = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const intent = event.data.object;

  if (event.type === "payment_intent.succeeded") {
    const payment = await prisma.payment.findUnique({
      where: { stripeIntentId: intent.id },
    });

    if (!payment || payment.status === "succeeded") {
      return res.json({ received: true });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "succeeded" },
    });

    await confirmBooking(payment.bookingId);

    logger.info("Payment success webhook", { intentId: intent.id });
  }

  if (event.type === "payment_intent.payment_failed") {
    const payment = await prisma.payment.findUnique({
      where: { stripeIntentId: intent.id },
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "failed" },
      });

      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { paymentStatus: "failed" },
      });
    }

    logger.info("Payment failed webhook", { intentId: intent.id });
  }

  res.json({ received: true });
};

module.exports = { stripeWebhookCtrl };
