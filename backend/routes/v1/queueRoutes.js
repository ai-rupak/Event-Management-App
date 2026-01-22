const express = require("express");
const router = express.Router();
const { joinQueue, getQueueStatus } = require("../../services/queueService.js");
const { SINGLE_CONCERT_ID } = require("../../config/constants.js");
const {authMiddleware} = require("../../middlewares/auth.js");


router.post("/join", authMiddleware, async (req, res) => {
  try {
    //const {userId} = req.body;
    const userId = req.user.userId;

    const result = await joinQueue(userId, SINGLE_CONCERT_ID);

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});


router.get("/status", authMiddleware, async (req, res) => {
  try {
    //  const {userId} = req.query;
    const userId = req.user.userId;


    const status = await getQueueStatus(userId, SINGLE_CONCERT_ID);

    res.json({
      success: true,
      ...status,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;
