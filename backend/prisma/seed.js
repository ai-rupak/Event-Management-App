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

async function seedSecondConcert() {
  const concert = await prisma.concert.create({
    data: {
      imageUrl: 'https://images.news18.com/ibnlive/uploads/2023/06/ar-rahman-live-concert.jpg',
      name: 'AR Rahman Live in Mumbai',
      date: new Date('2025-11-15T19:30:00Z'),
      venue: 'DY Patil Stadium, Navi Mumbai',
      gatesOpenTime: new Date('2025-11-15T16:30:00Z'),
      about: 'A.R. Rahman brings his legendary live concert experience to Mumbai, featuring iconic hits from Hindi, Tamil, and international cinema with stunning visuals and live orchestration.',
      languages: 'Hindi, Tamil, English',
      organizedBy: 'Percept Live',
      totalSeats: 15000, // will be synced
      availableSeats: 15000, // will be synced
    },
  });

  const categories = [
    { name: 'fanpit', price: 3500.0, totalSeats: 1500, availableSeats: 1500 },
    { name: 'diamond', price: 2500.0, totalSeats: 2500, availableSeats: 2500 },
    { name: 'platinum', price: 1800.0, totalSeats: 4000, availableSeats: 4000 },
    { name: 'gold', price: 1200.0, totalSeats: 3500, availableSeats: 3500 },
    { name: 'silver', price: 800.0, totalSeats: 3500, availableSeats: 3500 },
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

  await prisma.concert.update({
    where: { id: concert.id },
    data: {
      totalSeats: totalSeatsSum,
      availableSeats: availableSeatsSum,
    },
  });

  console.log('Seeded AR Rahman concert with categories');
}


// seed().finally(() => prisma.$disconnect());

// async function seed() {
//   await seedFirstConcert();   // your existing one
//   await seedSecondConcert();  // new one
// }

seedSecondConcert().finally(() => prisma.$disconnect());
