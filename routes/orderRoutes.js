// orderRoutes.js

const express = require("express");
const router = express.Router();
const { createOrder } = require("../controllers/orderControllers");

// Route để tạo đơn hàng
router.post("/orders", createOrder);

module.exports = router;
