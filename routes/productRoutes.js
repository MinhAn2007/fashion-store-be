const express = require('express');
const router = express.Router();
const productController = require('../controllers/productControllers');

// Route to get products with pagination
router.get('/products', productController.validatePagination, productController.getProductsWithPaging);

module.exports = router;
