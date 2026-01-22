const Redis = require("ioredis");
const { PrismaClient } = require("@prisma/client");

const redis = new Redis(process.env.REDIS_URL);
const prisma = new PrismaClient();

const MAX_ACTIVE_USERS = 50;
const SLOT_DURATION = 5 * 60; // 5 minutes

const QUEUE_KEY = (concertId) => `queue:concert:${concertId}`;
const ACTIVE_KEY = (concertId) => `active:concert:${concertId}`;
const SLOT_KEY = (concertId, userId) => `slot:${concertId}:${userId}`;


// JOIN QUEUE 

const joinQueue = async (userId, concertId) => {
  // Already active
  const isActive = await redis.sismember(ACTIVE_KEY(concertId), userId);
  if (isActive) {
    return { status: "active" };
  }

  // Already waiting
  const position = await redis.lpos(QUEUE_KEY(concertId), userId);
  if (position !== null) {
    return { status: "waiting", position: position + 1 };
  }

  // Add to queue
  await redis.rpush(QUEUE_KEY(concertId), userId);

  await prisma.bookingQueue.create({
    data: {
      userId,
      concertId,
      status: "waiting",
      position: 0,
    },
  });

  return { status: "queued" };
};

// PROMOTE USER TO ACTIVE SLOTS

const promoteUsers = async (concertId) => {
  const activeCount = await redis.scard(ACTIVE_KEY(concertId));
  const slotsAvailable = MAX_ACTIVE_USERS - activeCount;

  if (slotsAvailable <= 0) return;

  for (let i = 0; i < slotsAvailable; i++) {
    const userId = await redis.lpop(QUEUE_KEY(concertId));
    if (!userId) break;

    await redis.sadd(ACTIVE_KEY(concertId), userId);

    await redis.setex(
      SLOT_KEY(concertId, userId),
      SLOT_DURATION,
      Date.now().toString()
    );

    await prisma.bookingQueue.updateMany({
      where: { userId, concertId },
      data: {
        status: "active",
        timeSlot: new Date(Date.now() + SLOT_DURATION * 1000),
      },
    });
  }
};

// Check Queue Status (Used Before Booking)

const getQueueStatus = async (userId, concertId) => {
  const isActive = await redis.sismember(ACTIVE_KEY(concertId), userId);
  if (isActive) {
    return { status: "active" };
  }

  const position = await redis.lpos(QUEUE_KEY(concertId), userId);
  if (position !== null) {
    return { status: "waiting", position: position + 1 };
  }

  return { status: "none" };
};


// Release Slot (After Payment / Expiry)
const releaseSlot = async (userId, concertId) => {
  await redis.srem(ACTIVE_KEY(concertId), userId);
  await redis.del(SLOT_KEY(concertId, userId));

   // Immediately promote next user
  await promoteUsers(concertId);

  await prisma.bookingQueue.updateMany({
    where: { userId, concertId },
    data: { status: "completed" },
  });
};

const cleanExpiredSlots = async (concertId) => {
  const activeUsers = await redis.smembers(ACTIVE_KEY(concertId));

  for (const userId of activeUsers) {
    const slotExists = await redis.exists(SLOT_KEY(concertId, userId));

    if (!slotExists) {
      // Slot expired
      await redis.srem(ACTIVE_KEY(concertId), userId);

      await prisma.bookingQueue.updateMany({
        where: { userId, concertId },
        data: { status: "expired" }
      });
    }
  }

  await promoteUsers(concertId);
};


module.exports = {
  joinQueue,
  promoteUsers,
  getQueueStatus,
  releaseSlot,
  cleanExpiredSlots
};
