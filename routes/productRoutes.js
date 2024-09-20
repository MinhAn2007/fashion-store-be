const express = require('express');
const router = express.Router();
const productController = require('../controllers/productControllers');
const productMiddleware = require('../middlewares/productMiddleware');

// Route lấy sản phẩm với phân trang
router.get('/products', productMiddleware.validatePagination, productController.getProductsWithPaging);

// Route lấy chi tiết sản phẩm theo productID
router.get('/product/:id', productMiddleware.validateProductId, productController.getProductById);

module.exports = router;
