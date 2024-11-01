const express = require('express');
const router = express.Router();
const productController = require('../controllers/productControllers');
const productMiddleware = require('../middlewares/productMiddleware');

// Route lấy chi tiết sản phẩm theo productID
router.get('/product/:id', productMiddleware.validateProductId, productController.getProductById);

router.get('/category/:categoryId', productController.getProductsByCategory);

router.get('/products', productController.getAllProducts);

router.get('/bestseller', productController.getBestsellerProducts);

router.get('/getByPrice/:min/:max', productController.getProductsByPrice);

module.exports = router;
