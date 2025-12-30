

const { PrismaClient } = require("@prisma/client");
const logger = require("../config/logger");
const { SINGLE_CONCERT_ID } = require("../config/constants");

const prisma = new PrismaClient();

const getConcertCtrl = async (req, res) => {
  try {
    const concert = await prisma.concert.findUnique({
      where: { id: SINGLE_CONCERT_ID },
      include: { categories: true },
    });

    if (!concert) throw new Error("Concert not found");
    res.json(concert);
    console.log(concert);
  } catch (err) {
    logger.error("Get concert Error", { err });
    res.status(404).json({ error: err.message });
  }
};

module.exports = { getConcertCtrl };

 