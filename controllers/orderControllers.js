const OrderService = require("../services/orderService");

const createOrder = async (req, res) => {
  const { userId, cartItems, selectedAddress, paymentId, couponId, total } =
    req.body;
  console.log(req.body);

  try {
    // Kiểm tra các trường bắt buộc
    if (!userId || !cartItems || !cartItems.length || !selectedAddress) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin cần thiết để tạo đơn hàng.",
      });
    }

    // Gọi service để tạo đơn hàng
    const result = await OrderService.createOrder(
      userId,
      cartItems,
      selectedAddress,
      paymentId,
      couponId,
      total
    );

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Lỗi khi tạo đơn hàng:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Xuất controller
module.exports = {
  createOrder,
};
