const knex = require("../config/database").db;

// Hàm để lấy sản phẩm với phân trang
const getProductsWithPaging = async (limit, offset) => {
  try {
    const products = await knex("products as p")
      .leftJoin("products_skus as ps", "p.id", "ps.product_id")
      .select("p.id", "p.name", knex.raw("MIN(ps.price) as price"), "p.cover")
      .groupBy("p.id", "p.name", "p.cover")
      .orderBy(knex.raw("MAX(p.created_at)"), "desc")
      .limit(limit)
      .offset(offset);

    return products;
  } catch (error) {
    console.error("Error fetching products:", error.message);
    throw error;
  }
};
const getProductById = async (productId) => {
  try {
    const product = await knex('products as p')
    .select(
        'p.id',
        'p.name',
        'p.description',
        'p.summary',
        'p.cover',
        knex.raw(`JSON_ARRAYAGG(JSON_OBJECT('size', size.value, 'color', color.value, 'price', ps.price, 'quantity', ps.quantity)) as variants`)
    )
    .leftJoin('products_skus as ps', 'p.id', 'ps.product_id')
    .leftJoin('product_attributes as size', 'ps.size_attribute_id', 'size.id')
    .leftJoin('product_attributes as color', 'ps.color_attribute_id', 'color.id')
    .where('p.id', '1')
    .andWhere('p.deleted_at', null)
    .groupBy('p.id', 'p.name', 'p.description', 'p.summary', 'p.cover')
    .limit(1);
    return product;
  } catch (error) {
    console.error("Error fetching product by ID:", error.message);
    throw error;
  }
};

module.exports = {
  getProductsWithPaging,
  getProductById,
};
