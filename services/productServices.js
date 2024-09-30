const knex = require("../config/database").db;

// Hàm để lấy sản phẩm với phân trang
const getProductsWithPaging = async (limit, offset) => {
  try {
    const products = await knex("Product as p")
      .leftJoin("Products_Skus as ps", "p.id", "ps.product_id")
      .leftJoin("Product_Asset as pa", "p.id", "pa.product_id")
      .leftJoin("Assets as a", "pa.asset_id", "a.id") // Joining with Assets to get cover image
      .select(
        "p.id",
        "p.name",
        knex.raw("MIN(ps.price) as price"),
        knex.raw(`JSON_ARRAYAGG(a.path) as cover`)
      ) // Get all asset URLs associated with the product
      .where("p.deleted_at", null) // Ensure not fetching deleted products
      .groupBy("p.id", "p.name")
      .having(knex.raw("COUNT(a.id) > 0")) // Only include products with at least one asset
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
    const product = await knex("Product as p")
      .select(
        "p.id",
        "p.name",
        "p.description",
        "p.stock_quantity",
        "p.sold",
        "p.status",
        "p.featured",
        "p.created_at",
        "p.updated_at",
        knex.raw(
          `JSON_ARRAYAGG(JSON_OBJECT('size', size.value, 'color', color.value, 'price', ps.price, 'quantity', ps.quantity)) as variants`
        ),
        knex.raw(`JSON_ARRAYAGG(a.path) as assets`) // Get all asset URLs associated with the product
      )
      .leftJoin("Product_Asset as pa", "p.id", "pa.product_id") // Join to get product assets
      .leftJoin("Assets as a", "pa.asset_id", "a.id") // Join to get the asset details
      .leftJoin("Products_skus as ps", "p.id", "ps.product_id") // Join to get product SKUs
      .leftJoin("Product_Attribute as size", "ps.size_attribute_id", "size.id") // Join to get size attributes
      .leftJoin(
        "Product_Attribute as color",
        "ps.color_attribute_id",
        "color.id"
      ) // Join to get color attributes
      .where("p.id", productId)
      .andWhere("p.deleted_at", null) // Ensure product is not deleted
      .groupBy(
        "p.id",
        "p.name",
        "p.description",
        "p.stock_quantity",
        "p.sold",
        "p.status",
        "p.featured",
        "p.created_at",
        "p.updated_at"
      ) // Group by all non-aggregated fields
      .having(knex.raw("COUNT(a.id) > 0")) // Ensure the product has assets
      .limit(1);

    if (product.length) {
      const productData = product[0];
      // Set cover to the first asset URL if available, otherwise set it to null
      productData.cover = productData.assets.length
        ? productData.assets[0]
        : null;
      delete productData.assets; // Remove the assets array if you don't want it in the final output
      return productData;
    }
    return null; // Return null if not found
  } catch (error) {
    console.error("Error fetching product by ID:", error.message);
    throw error;
  }
};

module.exports = {
  getProductsWithPaging,
  getProductById,
};
