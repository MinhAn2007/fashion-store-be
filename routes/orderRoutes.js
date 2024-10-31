// orderRoutes.js

const express = require("express");
const router = express.Router();
const { createOrder , getOrdersWithDetails , cancelOrder, updateOrderStatus, returnOrder} = require("../controllers/orderControllers");

// Route để tạo đơn hàng
router.post("/orders", createOrder);

router.get("/orders", getOrdersWithDetails);

router.delete("/orders/:id", cancelOrder);

router.put("/orders/:id", updateOrderStatus);

router.post("/orders/:id/return", returnOrder);

module.exports = router;
