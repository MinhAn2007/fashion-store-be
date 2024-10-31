const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");

router.post("/reviews", reviewController.reviewProduct);

router.get("/reviews/product/:productId", reviewController.getReviewsByProductId);

module.exports = router;
