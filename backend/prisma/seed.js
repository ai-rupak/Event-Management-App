const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });



async function seed() {
  const concert = await prisma.concert.create({
    data: {
      imageUrl: 'https://www.livemint.com/lm-img/img/2025/07/28/optimize/anirudh_ravichander_hukum_concert_1753733999407_1753733999563_1753734002005.jpg',
      name: 'Hukum World Tour Bengaluru',
      date: new Date('2025-12-20T20:00:00Z'),     // Example ISO date
      venue: 'Terraform Arena, Yelahanka',
      gatesOpenTime: new Date('2025-12-20T17:00:00Z'),  // Gates open 2 hours before
      about: 'From a musical prodigy to one among the most sought-after composers in South Indian cinema, Anirudh Ravichander has come a long way since his sensational debut in the Kollywood romantic-psychological thriller 3 (2012).',
      languages: 'Tamil, Telugu, Hindi',
      organizedBy: 'KVN Productions',
      totalSeats: 10000,  // Will be overwritten by sum below
      availableSeats: 10000,  // Will be overwritten
    },
  });

  // Create categories (sum to totalSeats)
  const categories = [
    { name: 'fanpit', price: 2000.0, totalSeats: 1000, availableSeats: 1000 },
    { name: 'platinum', price: 1500.0, totalSeats: 2000, availableSeats: 2000 },
    { name: 'gold', price: 1000.0, totalSeats: 3000, availableSeats: 3000 },
    { name: 'silver', price: 500.0, totalSeats: 4000, availableSeats: 4000 },
  ];

  let totalSeatsSum = 0;
  let availableSeatsSum = 0;

  for (const cat of categories) {
    await prisma.ticketCategory.create({
      data: {
        ...cat,
        concertId: concert.id,
      },
    });
    totalSeatsSum += cat.totalSeats;
    availableSeatsSum += cat.availableSeats;
  }

  // Sync sums to concert
  await prisma.concert.update({
    where: { id: concert.id },
    data: {
      totalSeats: totalSeatsSum,
      availableSeats: availableSeatsSum,
    },
  });

  console.log('Seeded concert with categories');
}

seed().finally(() => prisma.$disconnect());

