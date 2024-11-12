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
}

const getProductStats = async (req, res) => {
  try {
    const productStats = await productService.getProductStats();

    res.status(200).json(productStats);
  } catch (error) {
    console.error("Error fetching product stats:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

const getProductRevenueStats = async (req, res) => {
  try {
    const productRevenueStats = await productService.getProductRevenueStats();

    res.status(200).json(productRevenueStats);
  } catch (error) {
    console.error("Error fetching product revenue stats:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

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
  getProductRevenueStats
};
