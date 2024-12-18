// orderRoutes.js

const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrdersWithDetails,
  cancelOrder,
  updateOrderStatus,
  returnOrder,
  getOrderDashboardTotal,
  getDashboardDetails,
  getOrderDashboard,
  checkCustomerIsGetOrder,
  getOrderDetails,
} = require("../controllers/orderControllers");

// Route để tạo đơn hàng
router.post("/orders", createOrder);

router.get("/orders", getOrdersWithDetails);

router.delete("/orders/:id", cancelOrder);

router.put("/orders/:id", updateOrderStatus);

router.post("/orders/:id/return", returnOrder);

router.get("/orders/dashboard/total", getOrderDashboardTotal);

router.get("/orders/dashboard/details", getDashboardDetails);

router.get("/orders/dashboard", getOrderDashboard);

router.get("/orders/:id", getOrderDetails);

router.put("/orders/:id/check", checkCustomerIsGetOrder);

module.exports = router;
