const knex = require("../config/database").db;

const reviewProduct = async (
  productId,
  userId,
  rating,
  content,
  images,
  video,
  title,
  orderId
) => {
  try {
    console.log(content);

    const review = await knex("Review")
      .insert({
        product_id: productId,
        customer_id: userId,
        rating,
        content,
        images: images ? images : null,
        video,
        title,
        created_at: new Date(),
        order_id: orderId,
      })
      .returning("*");

    return review[0];
  } catch (error) {
    console.error("Error during review product:", error.message);
    throw error;
  }
};

const getReviewsByUserId = async (userId) => {
  try {
    const reviews = await knex("Review").join("Product", "Review.product_id", "Product.id").select("Review.*", "Product.name").where("customer_id", userId);

    return reviews;
  } catch (error) {
    console.error("Error fetching reviews by user id:", error.message);
    throw error;
  }
};

const getReviewByOrderId = async (orderId) => {
  console.log(orderId);

  try {
    const reviews = await knex("Review").join("Product", "Review.product_id", "Product.id").select("Review.*", "Product.name").where("order_id", orderId);

    return reviews;
  } catch (error) {
    console.error("Error fetching reviews by order id:", error.message);
    throw error;
  }
};

//Admin

const getReviewStatistics = async () => {
  try {
    const totalReviews = await knex('Review').count('id as count').first();
    const positiveReviews = await knex('Review')
      .where('rating', '>=', 4)
      .count('id as count')
      .first();
    const negativeReviews = await knex('Review')
      .where('rating', '<=', 3)
      .count('id as count')
      .first();

    return {
      totalReviews: parseInt(totalReviews.count, 10),
      positiveReviews: parseInt(positiveReviews.count, 10),
      negativeReviews: parseInt(negativeReviews.count, 10),
    };
  } catch (error) {
    console.error('Error fetching review statistics:', error.message);
    throw error;
  }
};

// history
const getMonthlyReviewStatistics = async () => {
  try {
    const currentYear = new Date().getFullYear();

    // Truy vấn số lượng đánh giá tích cực và tiêu cực theo từng tháng của năm hiện tại
    const monthlyReviews = await knex('Review')
      .select(
        knex.raw("DATE_FORMAT(created_at, '%Y-%m') as month"), // Lấy tháng dưới dạng YYYY-MM
        knex.raw("SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) as positive"), // Đếm đánh giá tích cực
        knex.raw("SUM(CASE WHEN rating <= 3 THEN 1 ELSE 0 END) as negative")  // Đếm đánh giá tiêu cực
      )
      .whereRaw("YEAR(created_at) = ?", [currentYear])
      .groupByRaw("DATE_FORMAT(created_at, '%Y-%m')")
      .orderBy("month");

    return monthlyReviews; // Trả về dữ liệu monthlyReviews cho controller sử dụng
  } catch (error) {
    console.error("Error fetching monthly review statistics:", error.message);
    throw new Error("Lỗi khi lấy thống kê đánh giá hàng tháng");
  }
};

module.exports = {
  reviewProduct,
  getReviewsByUserId,
  getReviewByOrderId,
  getReviewStatistics,
  getMonthlyReviewStatistics
};
