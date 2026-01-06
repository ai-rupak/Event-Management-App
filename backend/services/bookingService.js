const { SINGLE_CONCERT_ID } = require("../config/constants");
const logger = require("../config/logger");
const { sendOrderConfirmation } = require("./emailService");
const {PrismaClient} = require('@prisma/client');

const prisma = new PrismaClient();
const getPendingBookings = async (userId, categoryId = null) => {
  const where = {
    userId,
    concertId: SINGLE_CONCERT_ID,
    status: "pending",
    expiresAt: { gt: new Date() },
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  return await prisma.booking.findFirst({
    where,
    include: { category: { select: { id: true, name: true, price: true } } },
  });
};

const createBooking = async (userId, data) => {
  const { categoryId, seats } = data;

  const pending = await getPendingBookings(userId, categoryId);

  if (pending) {
    throw new Error(
      "You have an active booking session for this category. Complete payment or wait for release"
    );
  }

  // const queueStatus = await getQueueStatus(userId, SINGLE_CONCERT_ID);

  // if (
  //   queueStatus.highDemand &&
  //   (queueStatus.status !== "active" ||
  //     (queueStatus.timeSlot && new Date() > queueStatus.timeSlot))
  // ) {
  //   throw new Error("High Demand : Wait for your slot or it expired");
  // }

  return prisma.$transaction(async (tx) => {
    const category = await tx.ticketCategory.findUnique({
      where: { id: categoryId },
    });

    if (
      !category ||
      category.concertId != SINGLE_CONCERT_ID ||
      category.availableSeats < seats
    ) {
      throw new Error("Invalid category or not enough seats");
    }

    const now = Date.now();
    const expiresAt = new Date(now + 10 * 60 * 1000);

    const booking = await tx.booking.create({
      data: {
        userId,
        concertId: SINGLE_CONCERT_ID,
        categoryId,
        seats,
        status: "pending",
        expiresAt,
      },
    });

    await tx.ticketCategory.update({
      where: { id: categoryId },
      data: { availableSeats: { decrement: seats } },
    });

    await tx.concert.update({
      where: { id: SINGLE_CONCERT_ID },
      data: { availableSeats: { decrement: seats } },
    });

    logger.info("Booking Created", { bookingId: booking.id, expiresAt });
    return booking;
  });
};

const confirmBooking = async (bookingId, userId) => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.userId !== userId || new Date() > booking.expiresAt) {
    throw new Error("Invalid or expired");
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "confirmed" },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  const concert = await prisma.concert.findUnique({
    where: { id: booking.concertId },
  });

  await sendOrderConfirmation(
    user.email,
    { seats: booking.seats, concertName: concert.name },
    { name: user.profile?.name || "N/A", email: user.email }
  );

  logger.info("Booking Confirmed", { bookingId });
};

const cancelPendingBooking = async (userId, categoryId) => {
  const pending = await getPendingBookings(userId, categoryId);
  if (!pending) throw new Error("No active session for this category");

  await prisma.$transaction(async (tx) => {
    await tx.ticketCategory.update({
      where: { id: categoryId },
      data: { availableSeats: { increment: pending.seats } },
    });

    await tx.concert.update({
      where: { id: SINGLE_CONCERT_ID },
      data: { availableSeats: { increment: pending.seats } },
    });

    await tx.booking.update({
      where: { id: pending.id },
      data: { status: "cancelled" },
    });
  });

  logger.info("Pending booking cancelled", { bookingId: pending.id });
  return { message: "Cancelled" };
};

const cleanExpiredBookings = async () => {
  const startTime = Date.now();

  await prisma.$transaction(
    async (tx) => {
      const expired = await tx.booking.findMany({
        where: { status: "pending", expiresAt: { lt: new Date() } },
        include: { category: true, concert: true },
      });

      for (const b of expired) {
        await tx.ticketCategory.update({
          where: { id: b.categoryId },
          data: { availableSeats: { increment: b.seats } },
        });

        await tx.concert.update({
          where: { id: b.concertId },
          data: { availableSeats: { increment: b.seats } },
        });

        await tx.booking.update({
          where: { id: b.id },
          data: { status: "expired" },
        });
      }
      logger.info("Clean expired bookings", {
        count: expired.length,
        duration: Date.now() - startTime,
      });
    },
    {
      timeout: 10000,
      maxWait: 5000,
    }
  );
};


const getConfirmedBooking = async (userId, bookingId) => {
  return await prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId,
      status: "confirmed"
    },
    include: {
      category: {
        select: { id: true, name: true, price: true }
      },
      concert: {
        select: {
          id: true,
          name: true,
          venue: true,
          date: true,
          imageUrl: true
        }
      }
    }
  })
}

const getUserBookings = async (userId) => {
  return await prisma.booking.findMany({
    where: {
      userId,
      status: "confirmed", // Only confirmed
    },
    include: {
      concert: {
        select: {
          id: true,
          name: true,
          venue: true,
          date: true,
          imageUrl: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          price: true,
        },
      },
    },
    orderBy: { bookedAt: "desc" }, // ← FIXED: Use bookedAt (your model's timestamp)
  });
};
module.exports = {
    createBooking,
    confirmBooking,
    getPendingBookings,
    cleanExpiredBookings,
    cancelPendingBooking,
    getConfirmedBooking,
    getUserBookings
};
