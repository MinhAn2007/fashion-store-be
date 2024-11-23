const voucherService = require("../services/voucherService");

const createVoucher = async (req, res) => {
  try {
    const voucher = await voucherService.createPromotion(req.body);
    res.status(201).json(voucher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const voucher = await voucherService.updatePromotion(id, req.body);
    res.status(200).json(voucher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await voucherService.deletePromotion(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPromotionDashboardData = async (req, res) => {
  try {
    const promotions = await voucherService.getPromotionDashboardData();
    res.json(promotions);
  } catch (error) {
    console.error("Error fetching promotion dashboard data:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const checkVoucher = async (req, res) => {
  try {
    const { code } = req.body;
    const voucher = await voucherService.checkVoucher(code);
    res.status(200).json(voucher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createVoucher,
  updateVoucher,
  deleteVoucher,
  getPromotionDashboardData,
  checkVoucher,
};
