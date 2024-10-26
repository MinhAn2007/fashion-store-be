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
    const query = knex("Product as p")
      .leftJoin("Category as c", "p.category_id", "c.id")
      .leftJoin("Category as parent", "c.parent_id", "parent.id")
      .leftJoin("Products_skus as ps", "p.id", "ps.product_id")
      .select(
        "p.id",
        "p.name",
        "p.description",
        "p.stock_quantity",
        "p.sold",
        "p.status",
        "p.featured",
        "c.name as category_name",
        "parent.name as parent_category_name",
        knex.raw("MIN(ps.price) as min_price"),
        knex.raw("MAX(ps.price) as max_price"),
        knex.raw("GROUP_CONCAT(DISTINCT ps.image) as images"),
        knex.raw(`
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', ps.id,
              'sku', ps.sku,
              'size', ps.size,
              'color', ps.color,
              'price', ps.price,
              'quantity', ps.quantity,
              'image', ps.image
            )
          ) as skus
        `)
      )
      .where("p.id", productId)
      .whereNull("p.deleted_at")
      .whereNull("ps.deleted_at")
      .groupBy(
        "p.id",
        "p.name",
        "p.description",
        "p.stock_quantity",
        "p.sold",
        "p.status",
        "p.featured",
        "c.name",
        "parent.name"
      );

    const product = await query.first();

    if (!product) {
      throw new Error("Product not found");
    }

    // Fetch all reviews for the product without is_approved condition
    const reviewsQuery = knex("Review as r")
      .select("r.id", "r.rating", "r.title", "r.content", "r.created_at", "r.images", "r.video")
      .where("r.product_id", productId)
      .orderBy("r.created_at", "desc");

    const reviews = await reviewsQuery;

    let skusArray;
    if (typeof product.skus === 'string') {
      skusArray = JSON.parse(product.skus); // Parse JSON string to array
    } else if (Array.isArray(product.skus)) {
      skusArray = product.skus; // Use directly if it's already an array
    } else {
      skusArray = []; // Fallback in case of unexpected format
    }

    // Define size order
    const sizeOrder = ["S", "M", "L"];

    // Filter and sort skus according to the size order
    const sortedSkus = skusArray
      .filter(sku => sizeOrder.includes(sku.size)) // Keep only sizes S, M, L
      .sort((a, b) => sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size)); // Sort by defined order

    // Combine product data and reviews
    return {
      ...product,
      skus: sortedSkus, // Include sorted SKUs
      reviews: reviews,  // Include all reviews with details
    };
  } catch (error) {
    console.error("Error fetching product by id:", error.message);
    throw error;
  }
};


const getProductsByCategory = async (categoryId) => {
  console.log("categoryId", categoryId);

  try {
    // Start building the query
    const query = knex("Category as c")
      .select(
        "c.id as category_id",
        "c.name as category_name",
        "p.id as product_id",
        "p.category_id",
        "p.name as product_name",
        "p.description",
        "p.stock_quantity",
        "p.sold",
        "p.status",
        "p.featured",
        "p.created_at",
        "p.updated_at",
        "p.deleted_at",
        knex.raw("AVG(r.rating) as rating"), // Average rating
        "ps.id as sku_id",
        "ps.size",
        "ps.color",
        "ps.sku",
        "ps.price",
        "ps.quantity",
        "ps.image"
      )
      .innerJoin("Product as p", "c.id", "=", "p.category_id") // Change LEFT JOIN to INNER JOIN
      .leftJoin("Products_skus as ps", "p.id", "=", "ps.product_id") // Keep this as LEFT JOIN
      .leftJoin("Review as r", "p.id", "=", "r.product_id"); // Keep this as LEFT JOIN

    // Apply category filter
    if (categoryId) {
      query.where("c.id", categoryId).orWhere("c.parent_id", categoryId);
    }

    console.log("Generated SQL query without GROUP BY:", query.toString());

    // Group by clause
    query.groupBy(
      "c.id",
      "c.name",
      "p.id",
      "p.category_id",
      "p.name",
      "p.description",
      "p.stock_quantity",
      "p.sold",
      "p.status",
      "p.featured",
      "p.created_at",
      "p.updated_at",
      "p.deleted_at",
      "ps.id",
      "ps.size",
      "ps.color",
      "ps.sku",
      "ps.price",
      "ps.quantity",
      "ps.image"
    );

    console.log("Generated SQL query with GROUP BY:", query.toString());

    const products = await query;

    // Format the results
    const formattedProducts = products.reduce((acc, product) => {
      const existingProduct = acc.find((p) => p.id === product.product_id);

      if (existingProduct) {
        existingProduct.skus.push({
          id: product.sku_id,
          size: product.size,
          color: product.color,
          sku: product.sku,
          price: product.price,
          quantity: product.quantity,
          image: product.image,
        });
      } else {
        acc.push({
          id: product.product_id,
          category_id: product.category_id,
          name: product.product_name,
          description: product.description,
          stock_quantity: product.stock_quantity,
          sold: product.sold,
          status: product.status,
          featured: product.featured,
          created_at: product.created_at,
          updated_at: product.updated_at,
          deleted_at: product.deleted_at,
          rating: product.rating,
          category_name: product.category_name,
          skus: [
            {
              id: product.sku_id,
              size: product.size,
              color: product.color,
              sku: product.sku,
              price: product.price,
              quantity: product.quantity,
              image: product.image,
            },
          ],
        });
      }

      return acc;
    }, []);

    return formattedProducts;
  } catch (error) {
    console.error("Error retrieving products:", error);
    throw error;
  }
};



const getAllProducts = async (limit = 10, offset = 0) => {
  try {
    const query = knex("Product as p")
      .leftJoin("Category as c", "p.category_id", "c.id")
      .leftJoin("Category as parent", "c.parent_id", "parent.id")
      .leftJoin("Products_skus as ps", "p.id", "ps.product_id")
      .leftJoin("Review as r", "p.id", "=", "r.product_id") // Thêm join với bảng Review
      .select(
        "p.id",
        "p.name",
        "p.description",
        "p.stock_quantity",
        "p.sold",
        "p.status",
        "p.featured",
        "c.name as category_name",
        "parent.name as parent_category_name",
        knex.raw("MIN(ps.price) as min_price"),
        knex.raw("MAX(ps.price) as max_price"),
        knex.raw("AVG(r.rating) as rating"),
        knex.raw("GROUP_CONCAT(DISTINCT ps.image) as images"),
        knex.raw(`
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', ps.id,
              'sku', ps.sku,
              'size', ps.size,
              'color', ps.color,
              'price', ps.price,
              'quantity', ps.quantity,
              'image', ps.image
            )
          ) as skus
        `)
      )
      .whereNull("p.deleted_at")
      .whereNull("ps.deleted_at")
      .groupBy(
        "p.id",
        "p.name",
        "p.description",
        "p.stock_quantity",
        "p.sold",
        "p.status",
        "p.featured",
        "c.name",
        "parent.name"
      )
      .orderBy("p.created_at", "desc")
      .limit(limit)
      .offset(offset);

    const products = await query;

    return products;
  } catch (error) {
    console.error("Error fetching all products:", error.message);
    throw error;
  }
};


const getBestsellerProducts = async (limit = 10, offset = 0) => {
  try {
    const query = knex("Product as p")
      .leftJoin("Category as c", "p.category_id", "c.id")
      .leftJoin("Category as parent", "c.parent_id", "parent.id")
      .leftJoin("Products_skus as ps", "p.id", "ps.product_id")
      .select(
        "p.id",
        "p.name",
        "p.description",
        "p.stock_quantity",
        "p.sold",
        "p.status",
        "p.featured",
        "c.name as category_name",
        "parent.name as parent_category_name",
        knex.raw("MIN(ps.price) as min_price"),
        knex.raw("MAX(ps.price) as max_price"),
        knex.raw("GROUP_CONCAT(DISTINCT ps.image) as images"),
        knex.raw(`
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', ps.id,
              'sku', ps.sku,
              'size', ps.size,
              'color', ps.color,
              'price', ps.price,
              'quantity', ps.quantity,
              'image', ps.image
            )
          ) as skus
        `)
      )
      .whereNull("p.deleted_at")
      .whereNull("ps.deleted_at")
      .where("p.status", 1) // Assuming status 1 means active
      .groupBy(
        "p.id",
        "p.name",
        "p.description",
        "p.stock_quantity",
        "p.sold",
        "p.status",
        "p.featured",
        "c.name",
        "parent.name"
      )
      .orderBy("p.sold", "desc")
      .limit(limit)
      .offset(offset);

    const bestsellerProducts = await query;
    return bestsellerProducts;
  } catch (error) {
    console.error("Error fetching bestseller products:", error.message);
    throw error;
  }
};

module.exports = {
  getProductsWithPaging,
  getProductById,
  getProductsByCategory,
  getAllProducts,
  getBestsellerProducts,
};
