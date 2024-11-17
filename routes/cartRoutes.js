const { fetchCartItems, updateCartItemQuantity, removeCartItem, addItemToCart } = require('../controllers/cartController');
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
// API lấy danh sách sản phẩm và tổng số lượng sản phẩm trong giỏ hàng
router.get('/cart/:customerId', fetchCartItems);
router.put('/cart/update-quantity', verifyToken, updateCartItemQuantity);
router.delete('/cart/remove-item', verifyToken, removeCartItem);
router.post('/cart/add-item', verifyToken, addItemToCart);

module.exports = router;