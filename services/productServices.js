const knex = require('../config/database').db;

// Hàm để lấy sản phẩm với phân trang
const getProductsWithPaging = async (limit, offset) => {
  try {
    const products = await knex('products as p')
      .leftJoin('products_skus as ps', 'p.id', 'ps.product_id')
      .select('p.id', 'p.name', knex.raw('MIN(ps.price) as price'), 'p.cover')
      .groupBy('p.id', 'p.name', 'p.cover')
      .orderBy(knex.raw('MAX(p.created_at)'), 'desc')
      .limit(limit)
      .offset(offset);
      
    return products;
  } catch (error) {
    console.error('Error fetching products:', error.message);
    throw error;
  }
};

module.exports = {
  getProductsWithPaging,
};
