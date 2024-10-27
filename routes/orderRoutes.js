// orderRoutes.js

const express = require("express");
const router = express.Router();
const { createOrder , getOrdersWithDetails} = require("../controllers/orderControllers");

// Route để tạo đơn hàng
router.post("/orders", createOrder);

router.get("/orders", getOrdersWithDetails);

module.exports = router;
