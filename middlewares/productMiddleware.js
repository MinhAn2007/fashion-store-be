const { query, param } = require('express-validator');

// Middleware validate phân trang
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

// Middleware validate productID
const validateProductId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer')
];

module.exports = {
  validatePagination,
  validateProductId,
};
