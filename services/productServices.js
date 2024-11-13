const knex = require("../config/database").db;

const getProductsWithPaging = async (limit, offset) => {
  try {
    const products = await knex("Product as p")
      .leftJoin("Products_Skus as ps", "p.id", "ps.product_id")
      .leftJoin("Product_Asset as pa", "p.id", "pa.product_id")
      .leftJoin("Assets as a", "pa.asset_id", "a.id")
      .select(
        "p.id",
        "p.name",
        knex.raw("MIN(ps.price) as price"),
        knex.raw(`JSON_ARRAYAGG(a.path) as cover`)
      )
      .where("p.deleted_at", null)
      .groupBy("p.id", "p.name")
      .having(knex.raw("COUNT(a.id) > 0"))
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
    const query = knex("Product as p")
      .leftJoin("Category as c", "p.category_id", "c.id")
      .leftJoin("Category as parent", "c.parent_id", "parent.id")
      .leftJoin("Products_skus as ps", "p.id", "ps.product_id")
      .select(
        "p.id",
        "p.name",
        "p.description",
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

    const reviewsQuery = knex("Review as r")
      .select(
        "r.id",
        "r.rating",
        "r.title",
        "r.content",
        "r.created_at",
        "r.images",
        "r.video"
      )
      .where("r.product_id", productId)
      .orderBy("r.created_at", "desc");

    const reviews = await reviewsQuery;

    let skusArray;
    if (typeof product.skus === "string") {
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
      .filter((sku) => sizeOrder.includes(sku.size)) // Keep only sizes S, M, L
      .sort((a, b) => sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size)); // Sort by defined order

    // Combine product data and reviews
    return {
      ...product,
      skus: sortedSkus, // Include sorted SKUs
      reviews: reviews, // Include all reviews with details
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

const getProductsByPrice = async (min, max) => {
  console.log("min", min);
  console.log("max", max);
  try {
    const query = knex("Product as p")
      .leftJoin("Category as c", "p.category_id", "c.id")
      .leftJoin("Category as parent", "c.parent_id", "parent.id")
      .leftJoin("Products_skus as ps", "p.id", "ps.product_id")
      .select(
        "p.id",
        "p.name",
        "p.description",
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
      .whereBetween("ps.price", [min, max])
      .groupBy(
        "p.id",
        "p.name",
        "p.description",
        "p.sold",
        "p.status",
        "p.featured",
        "c.name",
        "parent.name"
      )
      .orderBy("p.sold", "desc");

    const productByPrice = await query;
    return productByPrice;
  } catch (error) {
    console.error("Error fetching products:", error.message);
    throw error;
  }
};

const getNewProducts = async () => {
  try {
    const query = knex("Product as p")
      .leftJoin("Category as c", "p.category_id", "c.id")
      .leftJoin("Category as parent", "c.parent_id", "parent.id")
      .leftJoin("Products_skus as ps", "p.id", "ps.product_id")
      .select(
        "p.id",
        "p.name",
        "p.description",
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
      .groupBy(
        "p.id",
        "p.name",
        "p.description",
        "p.sold",
        "p.status",
        "p.featured",
        "c.name",
        "parent.name"
      )
      .orderBy("p.created_at", "desc")
      .limit(12);
    const newProducts = await query;
    return newProducts;
  } catch (error) {
    console.error("Error fetching new products:", error.message);
    throw error;
  }
};

const getProductsByCollection = async (collection) => {
  console.log("collection", collection);
  try {
    const query = knex("Product as p")
      .leftJoin("Category as c", "p.category_id", "c.id")
      .leftJoin("Category as parent", "c.parent_id", "parent.id")
      .leftJoin("Products_skus as ps", "p.id", "ps.product_id")
      .select(
        "p.id",
        "p.name",
        "p.description",
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
      .where("p.collection", collection)
      .groupBy(
        "p.id",
        "p.name",
        "p.description",
        "p.sold",
        "p.status",
        "p.featured",
        "c.name",
        "parent.name"
      )
      .orderBy("p.created_at", "desc")
      .limit(12);
    const products = await query;
    return products;
  } catch (error) {
    console.error("Error fetching products by collection:", error.message);
    throw error;
  }
};

const searchProducts = async (keyword) => {
  try {
    const products = await knex("Product as p")
      .leftJoin("Category as c", "p.category_id", "c.id")
      .leftJoin("Category as parent", "c.parent_id", "parent.id")
      .leftJoin("Products_skus as ps", "p.id", "ps.product_id")
      .select(
        "p.id",
        "p.name",
        "p.description",
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
      .where("p.name", "like", `%${keyword}%`)
      .groupBy(
        "p.id",
        "p.name",
        "p.description",
        "p.sold",
        "p.status",
        "p.featured",
        "c.name",
        "parent.name"
      )
      .orderBy("p.created_at", "desc");
    return products;
  } catch (error) {
    console.error("Error fetching products by keyword:", error.message);
    throw error;
  }
};

const getProductStats = async (timeRange) => {
  try {
    let startDate, endDate;
    const currentDate = new Date();
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(currentDate.setFullYear(currentDate.getFullYear() - 1));
        break;
      case 'first_6_months':
        startDate = new Date(currentDate.getFullYear(), 0, 1); // 1st Jan current year
        endDate = new Date(currentDate.getFullYear(), 5, 30); // 30th June current year
        break;
      default:
        startDate = new Date(0); // Từ đầu
        endDate = new Date(); // Đến hiện tại
    }

    // Query để lấy thống kê tổng quan
    const statsQuery = knex("OrderItem as oi")
      .join("Product as p", "oi.product_id", "p.id")
      .join("Order as o", "oi.order_id", "o.id")
      .select(
        knex.raw("SUM(oi.quantity) as total_sales"),
        knex.raw("SUM(oi.quantity * oi.price) as total_revenue"),
        knex.raw("COUNT(DISTINCT p.id) as total_products")
      )
      .where("o.status", "completed")
      .whereBetween("o.created_at", [startDate, endDate || new Date()]);

    // Query để lấy top sản phẩm bán chạy
    const topProductsQuery = knex("OrderItem as oi")
      .join("Product as p", "oi.product_id", "p.id")
      .join("Order as o", "oi.order_id", "o.id")
      .select(
        "p.id",
        "p.name",
        knex.raw("SUM(oi.quantity) as sales"),
        knex.raw("SUM(oi.quantity * oi.price) as revenue")
      )
      .where("o.status", "completed")
      .whereBetween("o.created_at", [startDate, endDate || new Date()])
      .groupBy("p.id", "p.name")
      .orderBy("sales", "desc")
      .limit(5);

    // Query để lấy doanh số theo thời gian
    const salesByTimeQuery = knex("OrderItem as oi")
      .join("Order as o", "oi.order_id", "o.id")
      .select(
        knex.raw("DATE_FORMAT(o.created_at, '%Y-%m') as period"),
        knex.raw("SUM(oi.quantity) as total_quantity"),
        knex.raw("SUM(oi.quantity * oi.price) as total_revenue")
      )
      .where("o.status", "completed")
      .whereBetween("o.created_at", [startDate, endDate || new Date()])
      .groupBy(knex.raw("DATE_FORMAT(o.created_at, '%Y-%m')"))
      .orderBy("period", "asc");

    // Thực hiện tất cả các queries cùng lúc
    const [stats, topProducts, salesByTime] = await Promise.all([
      statsQuery.first(),
      topProductsQuery,
      salesByTimeQuery
    ]);

    return {
      summary: stats,
      topProducts,
      salesByTime
    };
  } catch (error) {
    console.error("Error fetching product statistics:", error.message);
    throw error;
  }
};

const getInventoryStats = async () => {
  try {
    // Query lấy thống kê tồn kho
    const inventoryStats = await knex("Products_skus as ps")
      .join("Product as p", "ps.product_id", "p.id")
      .select(
        "p.id",
        "p.name",
        knex.raw("SUM(ps.quantity) as total_stock"),
        knex.raw("GROUP_CONCAT(DISTINCT ps.size) as sizes"),
        knex.raw("COUNT(DISTINCT ps.color) as color_variants")
      )
      .whereNull("p.deleted_at")
      .groupBy("p.id", "p.name")
      .orderBy("total_stock", "desc")
      .limit(5);

    // Query lấy sản phẩm sắp hết hàng (dưới 10 items)
    const lowStockProducts = await knex("Products_skus as ps")
      .join("Product as p", "ps.product_id", "p.id")
      .select(
        "p.id",
        "p.name",
        "ps.size",
        "ps.color",
        "ps.quantity"
      )
      .whereNull("p.deleted_at")
      .where("ps.quantity", "<", 10)
      .orderBy("ps.quantity", "asc");

    return {
      inventoryStats,
      lowStockProducts
    };
  } catch (error) {
    console.error("Error fetching inventory statistics:", error.message);
    throw error;
  }
};

const getProductRevenueStats = async (timeRange) => {
  try {
    let startDate, endDate;
    const currentDate = new Date();
    
    // Xử lý timeRange tương tự như getProductStats
    switch (timeRange) {
      case 'week':
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(currentDate.setFullYear(currentDate.getFullYear() - 1));
        break;
      case 'first_6_months':
        startDate = new Date(currentDate.getFullYear(), 0, 1);
        endDate = new Date(currentDate.getFullYear(), 5, 30);
        break;
      default:
        startDate = new Date(0);
        endDate = new Date();
    }

    const revenueStats = await knex("OrderItem as oi")
      .join("Product as p", "oi.product_id", "p.id")
      .join("Order as o", "oi.order_id", "o.id")
      .select(
        "p.id",
        "p.name",
        knex.raw("SUM(oi.quantity) as total_sales"),
        knex.raw("SUM(oi.quantity * oi.price) as total_revenue"),
        knex.raw("AVG(oi.price) as average_price")
      )
      .where("o.status", "completed")
      .whereBetween("o.created_at", [startDate, endDate || new Date()])
      .groupBy("p.id", "p.name")
      .orderBy("total_revenue", "desc");

    return revenueStats;
  } catch (error) {
    console.error("Error fetching product revenue statistics:", error.message);
    throw error;
  }
};



module.exports = {
  getProductsWithPaging,
  getProductById,
  getProductsByCategory,
  getAllProducts,
  getBestsellerProducts,
  getProductsByPrice,
  getNewProducts,
  getProductsByCollection,
  searchProducts,
  getProductStats,
  getInventoryStats,
  getProductRevenueStats
};
