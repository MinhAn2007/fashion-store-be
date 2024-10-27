// controllers/cartController.js
const cartService = require("../services/cartServices");
const fetchCartItems = async (req, res) => {
  const { customerId } = req.params;

  try {
    const { totalQuantity, cartItems } = await cartService.getCartItems(
      customerId
    );

    // Trả về kết quả
    res.status(200).json({
      totalQuantity,
      cartItems,
    });
  } catch (error) {
    console.error("Error fetching cart data:", error);
    res
      .status(500)
      .json({ message: "Có lỗi xảy ra khi lấy dữ liệu giỏ hàng." });
  }
};

const updateCartItemQuantity = async (req, res) => {
  try {
    const { productId, quantity, userId } = req.body;
    console.log("req.body", req.body);

    if (!productId || !quantity || !userId) {
      return res.status(400).json({
        error: "productId, quantity, userId are required",
      });
    }

    const result = await cartService.updateCartItemQuantity(
      userId,
      productId,
      quantity
    );
    res.json(result);
  } catch (error) {
    console.error("Cart update error:", error);
    res.status(500).json({
      error: error.message || "Error updating cart item",
    });
  }
};

const removeCartItem = async (req, res) => {
  const { productId, userId } = req.body;

  if (!productId || !userId) {
    return res.status(400).json({
      error: "productId và userId là bắt buộc",
    });
  }

  try {
    const updatedCartItems = await cartService.removeCartItem(
      userId,
      productId
    );
    res.status(200).json({
      message: "Sản phẩm đã được xóa khỏi giỏ hàng",
      updatedCartItems,
    });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).json({
      error: error.message || "Có lỗi xảy ra khi xóa sản phẩm khỏi giỏ hàng",
    });
  }
};

const addItemToCart = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    const result = await cartService.addItemToCart(userId, productId, quantity);

    res.status(200).json({
      success: true,
      message: "Thêm sản phẩm vào giỏ hàng thành công",
      cartItems: result.cartItems,
      totalQuantity: result.totalQuantity,
    });
  } catch (error) {
    console.error("Controller error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Không thể thêm sản phẩm vào giỏ hàng",
    });
  }
};

module.exports = {
  updateCartItemQuantity,
  fetchCartItems,
  removeCartItem,
  addItemToCart,
};
