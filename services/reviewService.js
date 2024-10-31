const knex = require("../config/database").db;

const reviewProduct = async (
  productId,
  userId,
  rating,
  content,
  image,
  video
) => {
  try {
    const review = await knex("Review")
      .insert({
        product_id: productId,
        user_id: userId,
        rating,
        content,
        image,
        video,
      })
      .returning("*");

    return review[0];
  } catch (error) {
    console.error("Error during review product:", error.message);
    throw error;
  }
};
