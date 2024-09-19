const { validationResult, query } = require('express-validator');
const productService = require('../services/productServices');

// Validation middleware
const validatePagination = [
  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Limit must be a positive integer'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
];

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
    const products = await productService.getProductsWithPaging(limitNumber, offset);
    res.json({
      page: pageNumber,
      limit: limitNumber,
      offset: offset,
      products: products
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  validatePagination,
  getProductsWithPaging,
};
