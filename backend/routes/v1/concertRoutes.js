const express = require("express");
const { getConcertCtrl } = require("../../controllers/concertController");

const router = express.Router();

router.get("/", getConcertCtrl);

module.exports = router;