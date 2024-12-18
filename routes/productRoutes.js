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

router.get('/newProducts', productController.getNewProducts);

router.get('/getByCollection/:collection', productController.getProductsByCollection);

router.get('/search', productController.searchProducts);

router.get('/inventoryStats', productController.getInventoryStats);

router.get('/productStats', productController.getProductStats);

router.get('/productRevenueStats', productController.getProductRevenueStats);

router.put('/product/:id', productController.editProduct);

router.delete('/product/:id', productController.deleteProduct);

router.post('/product', productController.addProduct);

router.get('/product/sku/:id', productController.getSKUdetails);

router.post('/product/sku/:id', productController.addSku);

router.put('/product/sku/:id', productController.editSKU);

router.delete('/product/sku/:id', productController.deleteSKU);

module.exports = router;
