const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");

router.post("/reviews", reviewController.reviewProduct);

router.get("/reviews/user/:id", reviewController.getReviewsByUserId);

router.post("/uploadAvatarS3/:userId", reviewController.uploadAvatarS3);

router.get("/reviews/order/:id", reviewController.getReviewByOrderId);

module.exports = router;
