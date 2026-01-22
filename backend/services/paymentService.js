const logger = require("../config/logger");
const redis = require("../config/redis");
const stripe = require("../config/stripe");
const ACTIVE_KEY = (concertId) => `active:concert:${concertId}`;
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();



const getKeyService = async () => {
  return{ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY };
};

const createPaymentIntentService = async (userId, booking) => {
const amount = booking.category.price * booking.seats * 100; // paise

  // 1️⃣ Check if payment already exists
  let payment = await prisma.payment.findUnique({
    where: {
      bookingId: booking.id,
    },
  });

  // 2️⃣ If payment already exists → reuse Stripe intent
  if (payment) {
    const intent = await stripe.paymentIntents.retrieve(
      payment.stripeIntentId
    );

    // If intent already succeeded, block retry
    if (intent.status === "succeeded") {
      throw new Error("Payment already completed");
    }

    return {
      clientSecret: intent.client_secret,
    };
  }

  // 3️⃣ Create Stripe PaymentIntent (ONLY ONCE)
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(booking.seats * booking.category.price * 100),
    currency: "inr",
    metadata: {
      bookingId: booking.id,
      userId,
    },
    automatic_payment_methods: { enabled: true },
  });

  // 4️⃣ Store Payment in DB
  await prisma.payment.create({
    data: {
      userId,
      bookingId: booking.id,
      stripeIntentId: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      status: "created",
    },
  });

  // 5️⃣ Update booking payment fields
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      paymentStatus: "processing",
      paymentIntentId: intent.id,
    },
  });

  return {
    clientSecret: intent.client_secret,
  };
};
module.exports = { createPaymentIntentService, getKeyService };
