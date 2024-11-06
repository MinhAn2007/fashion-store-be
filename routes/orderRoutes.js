// orderRoutes.js

const express = require("express");
const router = express.Router();
const { createOrder , getOrdersWithDetails , cancelOrder, updateOrderStatus, returnOrder, getOrderDashboard} = require("../controllers/orderControllers");

// Route để tạo đơn hàng
router.post("/orders", createOrder);

router.get("/orders", getOrdersWithDetails);

router.delete("/orders/:id", cancelOrder);

router.put("/orders/:id", updateOrderStatus);

router.post("/orders/:id/return", returnOrder);

router.get("/orders/dashboard", getOrderDashboard);
module.exports = router;
