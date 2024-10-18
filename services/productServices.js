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
      .leftJoin("Product_Attribute as size", "ps.size", "size.id") // Join to get size attributes
      .leftJoin(
        "Product_Attribute as color",
        "ps.color",
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

const getProductsByCategory = async (categoryId) => {
  try {
    const products = await knex('Product as p')
      .select(
        'p.id',
        'p.category_id',
        'p.name',
        'p.description',
        'p.stock_quantity',
        'p.sold',
        'p.status',
        'p.featured',
        'p.created_at',
        'p.updated_at',
        'p.deleted_at',
        'c.name as category_name',
        'ps.id as sku_id',              // ID của SKU
        'ps.size',          // Kích thước
        'ps.color',         // Màu sắc
        'ps.sku',                        // Mã SKU
        'ps.price',                      // Giá
        'ps.quantity',                   // Số lượng
        'ps.image'                       // Hình ảnh
      )
      .join('Category as c', function() {
        this.on('p.category_id', '=', 'c.id').orOn('p.category_id', '=', 'c.parent_id');
      })
      .leftJoin('Products_skus as ps', 'p.id', '=', 'ps.product_id')
      .where('c.id', categoryId)
      .orWhere('c.parent_id', categoryId);

    // Chuyển đổi kết quả thành định dạng mong muốn
    const formattedProducts = products.reduce((acc, product) => {
      const existingProduct = acc.find(p => p.id === product.id);

      if (existingProduct) {
        // Nếu sản phẩm đã tồn tại, thêm SKU vào mảng SKU
        existingProduct.sku.push({
          id: product.sku_id,
          size: product.size,
          color: product.color,
          sku: product.sku,
          price: product.price,
          quantity: product.quantity,
          image: product.image
        });
      } else {
        // Nếu sản phẩm chưa tồn tại, thêm sản phẩm mới
        acc.push({
          id: product.id,
          category_id: product.category_id,
          name: product.name,
          description: product.description,
          stock_quantity: product.stock_quantity,
          sold: product.sold,
          status: product.status,
          featured: product.featured,
          created_at: product.created_at,
          updated_at: product.updated_at,
          deleted_at: product.deleted_at,
          category_name: product.category_name,
          sku: [{
            id: product.sku_id,
            size: product.size,
            color: product.color,
            sku: product.sku,
            price: product.price,
            quantity: product.quantity,
            image: product.image
          }] // Khởi tạo mảng SKU với SKU đầu tiên
        });
      }

      return acc;
    }, []);

    return formattedProducts
  } catch (error) {
    console.error('Error retrieving products:', error);
    throw error;
  }
}

module.exports = {
  getProductsWithPaging,
  getProductById,
  getProductsByCategory,
};
