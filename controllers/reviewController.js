const reviewService = require("../services/reviewService");

const getReviewsByProductId = async (req, res) => {
  const productId = req.params.id;

  try {
    const reviews = await reviewService.getReviewsByProductId(productId);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const reviewProduct = async (req, res) => {
  const { productId, userId, rating, content, image, video } = req.body;

  try {
    const review = await reviewService.reviewProduct(
      productId,
      userId,
      rating,
      content,
      image,
      video
    );
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getReviewsByProductId,
  reviewProduct,
};
