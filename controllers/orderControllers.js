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

const getOrdersWithDetails = async (req, res) => {
  try {
    const userId = req.query.userId;
    const orders = await OrderService.getOrdersWithDetails(userId);
    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin đơn hàng:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const cancellationReason = req.body.reason;
    const result = await OrderService.cancelOrder(orderId, cancellationReason);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Lỗi khi hủy đơn hàng:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const status = req.body.status;
    const result = await OrderService.updateOrderStatus(orderId, status);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const returnOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const reason = req.body.reason;
    console.log(reason);
    
    const result = await OrderService.returnOrder(orderId,reason);
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("Lỗi khi trả đơn hàng:", error.message);
    return res.status(500).json({
      success: false,
    });
  }
};

const getOrderDashboardTotal = async (req, res) => {
  try {
    const time = req.query.time;
    const orders = await OrderService.getDashboardTotals(time);
    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin đơn hàng:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getDashboardDetails = async (req, res) => {
  try {
    const time = req.query.time;
    const orders = await OrderService.getDashboardDetails(time);
    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin đơn hàng:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

const getOrderDashboard = async (req, res) => {
  try {
    const orders = await OrderService.getOrderDashboard();
    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin đơn hàng:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await OrderService.getOrderDetails(orderId);
    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin đơn hàng:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getOrdersWithDetails,
  cancelOrder,
  updateOrderStatus,
  returnOrder,
  getOrderDashboardTotal,
  getDashboardDetails,
  getOrderDashboard,
  getOrderDetails,
};
