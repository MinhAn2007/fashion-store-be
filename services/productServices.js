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

// Function to get product by ID and ensure it has assets
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
          `JSON_ARRAYAGG(
            JSON_OBJECT(
              'size', size.value, 
              'color', color.value, 
              'price', ps.price, 
              'quantity', ps.quantity, 
              'image', img.path
            )
          ) as variants`
        ), // Now including image for each variant
        knex.raw(`JSON_ARRAYAGG(a.path) as cover`) // Get all asset URLs associated with the product as an array
      )
      .leftJoin("Product_Asset as pa", "p.id", "pa.product_id") // Join to get product assets
      .leftJoin("Assets as a", "pa.asset_id", "a.id") // Join to get asset details
      .leftJoin("Products_Skus as ps", "p.id", "ps.product_id") // Join to get product SKUs
      .leftJoin("Assets as img", "ps.image_id", "img.id") // Join to get the image for each variant
      .leftJoin("Product_Attribute as size", "ps.size_attribute_id", "size.id") // Join to get size attributes
      .leftJoin("Product_Attribute as color", "ps.color_attribute_id", "color.id") // Join to get color attributes
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
      ) 
      .limit(1);

    if (product.length) {
      const productData = product[0];
      return productData;
    }
    return null; // Return null if not found
  } catch (error) {
    console.error("Error fetching product by ID:", error.message);
    throw error;
  }
};
const getProductsByCategory = async (categoryId, limit, offset) => {
  try {
    const products = await knex("Product as p")
      .leftJoin("Products_Skus as ps", "p.id", "ps.product_id")
      .leftJoin("Product_Asset as pa", "p.id", "pa.product_id")
      .leftJoin("Assets as a", "pa.asset_id", "a.id") // Join to get product images
      .leftJoin("Category as c", "p.category_id", "c.id") // Join to get category name
      .leftJoin("Category as parent", "c.parent_id", "parent.id") // Join to get parent category name
      .leftJoin("Product_Attribute as pa1", "p.id", "pa1.product_id") // Join to get product attributes
      .leftJoin("Attributes as a1", "pa1.attribute_id", "a1.id") // Join to get attribute details
      .select(
        "p.id",
        "p.name",
        "p.description",
        "p.stock_quantity",
        "p.sold",
        "p.status",
        "p.featured",
        knex.raw("MIN(ps.price) as price"),
        knex.raw(`GROUP_CONCAT(DISTINCT a.path) as cover`), // Get all asset URLs for product
        "c.name as category_name", // Category name
        "parent.name as parent_category_name", // Parent category name
        knex.raw(`GROUP_CONCAT(DISTINCT CONCAT('{\"attribute\":\"', a1.name, '\", \"value\":\"', pa1.value, '\"}')) as attributes`), // Get attributes as JSON strings
        knex.raw(`GROUP_CONCAT(DISTINCT CONCAT('{\"sku\":\"', ps.sku, '\", \"price\":', ps.price, ', \"quantity\":', ps.quantity, '}')) as skus`) // Get SKUs as JSON strings
      )
      .where("p.category_id", categoryId) // Filter by category_id
      .andWhere("p.deleted_at", null) // Only fetch non-deleted products
      .groupBy("p.id", "p.name", "p.description", "p.stock_quantity", "p.sold", "p.status", "p.featured", "c.name", "parent.name")
      .having(knex.raw("COUNT(a.id) > 0")) // Only include products with at least one image
      .orderBy(knex.raw("MAX(p.created_at)"), "desc")
      .limit(limit)
      .offset(offset);
      
    return products;
  } catch (error) {
    console.error("Error fetching products by category:", error.message);
    throw error;
  }
};

module.exports = {
  getProductsWithPaging,
  getProductById,
  getProductsByCategory
};
