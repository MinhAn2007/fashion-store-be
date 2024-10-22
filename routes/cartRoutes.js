const { fetchCartItems } = require('../controllers/cartController');
const express = require('express');
const router = express.Router();
// API lấy danh sách sản phẩm và tổng số lượng sản phẩm trong giỏ hàng
router.get('/cart/:customerId', fetchCartItems);

module.exports = router;