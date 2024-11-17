const { validationResult } = require("express-validator");
const productService = require("../services/productServices");

// Controller lấy sản phẩm với phân trang
const getProductsWithPaging = async (req, res) => {
  // Validate query parameters
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { limit = 10, page = 1 } = req.query;
  const limitNumber = parseInt(limit);
  const pageNumber = parseInt(page);
  const offset = (pageNumber - 1) * limitNumber;

  try {
    const products = await productService.getProductsWithPaging(
      limitNumber,
      offset
    );
    res.json({
      page: pageNumber,
      limit: limitNumber,
      offset: offset,
      products: products,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Controller lấy chi tiết sản phẩm theo productID
const getProductById = async (req, res) => {
  // Validate product ID
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const productId = req.params.id;

  try {
    const product = await productService.getProductById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getProductsByCategory = async (req, res) => {
  // Validate query parameters
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const categoryId = req.params.categoryId;
  const { limit = 10, page = 1 } = req.query;
  const limitNumber = parseInt(limit);
  const pageNumber = parseInt(page);
  const offset = (pageNumber - 1) * limitNumber;

  try {
    const products = await productService.getProductsByCategory(
      categoryId,
      limitNumber,
      offset
    );
    console.log(products);

    if (products.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found in this category" });
    }

    res.status(200).json({
      categoryId: categoryId,
      // page: pageNumber,
      // limit: limitNumber,
      // offset: offset,
      products: products,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await productService.getAllProducts(); // Gọi hàm lấy tất cả sản phẩm

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    res.status(200).json({
      products: products,
    });
  } catch (error) {
    console.error("Error fetching all products:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getBestsellerProducts = async (req, res) => {
  try {
    const products = await productService.getBestsellerProducts();

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    res.status(200).json({
      products: products,
    });
  } catch (error) {
    console.error("Error fetching all products:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getProductsByPrice = async (req, res) => {
  const min = req.params.min;
  const max = req.params.max;
  try {
    const products = await productService.getProductsByPrice(min, max);

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    res.status(200).json({
      products: products,
    });
  } catch (error) {
    console.error("Error fetching all products:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getNewProducts = async (req, res) => {
  try {
    const products = await productService.getNewProducts();

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    res.status(200).json({
      products: products,
    });
  } catch (error) {
    console.error("Error fetching all products:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getProductsByCollection = async (req, res) => {
  const collection = req.params.collection;
  try {
    const products = await productService.getProductsByCollection(collection);

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    res.status(200).json({
      products: products,
    });
  } catch (error) {
    console.error("Error fetching all products:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const searchProducts = async (req, res) => {
  const query = req.query.q;
  try {
    const products = await productService.searchProducts(query);

    if (products.length === 0) {
      return res.status(200).json({ message: "No products found" });
    }

    res.status(200).json({
      products: products,
    });
  } catch (error) {
    console.error("Error fetching all products:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getInventoryStats = async (req, res) => {
  try {
    const inventoryStats = await productService.getInventoryStats();

    res.status(200).json(inventoryStats);
  } catch (error) {
    console.error("Error fetching inventory stats:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getProductStats = async (req, res) => {
  try {
    const productStats = await productService.getProductStats();

    res.status(200).json(productStats);
  } catch (error) {
    console.error("Error fetching product stats:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getProductRevenueStats = async (req, res) => {
  try {
    const productRevenueStats = await productService.getProductRevenueStats();

    res.status(200).json(productRevenueStats);
  } catch (error) {
    console.error("Error fetching product revenue stats:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const editProduct = async (req, res) => {
  const productId = req.params.id;
  const product = req.body;
  console.log("req", req);

  console.log("req.body", req.body);

  try {
    const updatedProduct = await productService.editProduct(productId, product);

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  const productId = req.params.id;
  try {
    const deletedProduct = await productService.deleteProduct(productId);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(deletedProduct);
  } catch (error) {
    console.error("Error deleting product:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const addProduct = async (req, res) => {
  console.log("req.body", req.body);

  const { name, description, category_id, status, skus } = req.body;

  const product = {
    name,
    description,
    category_id,
    status,
  };

  console.log("product", product);
  console.log("skus", skus);

  try {
    const newProduct = await productService.addProduct(product, skus);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error adding product:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getSKUdetails = async (req, res) => {
  const productId = req.params.id;
  try {
    const skus = await productService.getSKUdetails(productId);

    if (skus.length === 0) {
      return res.status(404).json({ message: "No skus found" });
    }

    res.status(200).json({
      skus: skus,
    });
  } catch (error) {
    console.error("Error fetching all skus:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const addSku = async (req, res) => {
  const productId = req.params.id;
  const sku = req.body;
  try {
    const newSku = await productService.addSku(productId, sku);
    res.status(201).json(newSku);
  } catch (error) {
    console.error("Error adding sku:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getProductsByPrice,
  getProductsWithPaging,
  getProductById,
  getProductsByCategory,
  getAllProducts,
  getBestsellerProducts,
  getNewProducts,
  getProductsByCollection,
  searchProducts,
  getInventoryStats,
  getProductStats,
  getProductRevenueStats,
  editProduct,
  deleteProduct,
  addProduct,
  getSKUdetails,
  addSku,
};
