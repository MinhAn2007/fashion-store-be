const { fetchCartItems,updateCartItemQuantity } = require('../controllers/cartController');
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
// API lấy danh sách sản phẩm và tổng số lượng sản phẩm trong giỏ hàng
router.get('/cart/:customerId', fetchCartItems);
router.put('/cart/update-quantity', authMiddleware, updateCartItemQuantity);

module.exports = router;