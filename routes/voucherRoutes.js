const express = require("express");
const router = express.Router();
const voucherController = require("../controllers/voucherController");

router.post("/voucher", voucherController.createVoucher);

router.put("/voucher/:id", voucherController.updateVoucher);

router.delete("/voucher/:id", voucherController.deleteVoucher);

router.get("/voucher/dashboard", voucherController.getPromotionDashboardData);

router.post("/voucher/check", voucherController.checkVoucher);

module.exports = router;

