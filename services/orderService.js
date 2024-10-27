const knex = require("../config/database").db;
const cartService = require("./cartServices");
const createOrder = async (
  userId,
  cartItems,
  selectedAddress,
  paymentId,
  couponId,
  total
) => {
  try {
    // Kiểm tra xem người dùng có tồn tại không
    const user = await knex("User").where({ id: userId }).first();
    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    for (const item of cartItems) {
      await cartService.removeCartItem(userId, item.productId);
    }

    // Chuẩn bị dữ liệu cho đơn hàng
    const orderInsert = {
      address: selectedAddress,
      coupon_id: couponId || null,
      created_at: new Date(),
      customer_id: userId,
      payment_id: paymentId,
      shipping_fee: 30000,
      status: "Pending Confirmation",
      total,
    };

    // Tạo đơn hàng
    const order = await knex("Order").insert(orderInsert).returning("*");

    // Xử lý các mục trong giỏ hàng và cập nhật số lượng tồn kho
    for (const item of cartItems) {
      const productSku = await knex("Products_skus")
        .select("Products_skus.*", "Product.name as product_name")
        .join("Product", "Products_skus.product_id", "=", "Product.id")
        .where("Products_skus.id", item.id)
        .first();

      if (!productSku) {
        throw new Error(`Sản phẩm với SKU ${item.id} không tồn tại`);
      }

      await knex("OrderItem").insert({
        order_id: order,
        product_id: productSku.id,
        name: productSku.sku,
        quantity: item.quantity,
        price: productSku.price,
      });

      // Cập nhật số lượng tồn kho sau khi đặt hàng
      const newQuantity = productSku.quantity - item.quantity;
      if (newQuantity < 0) {
        throw new Error(`Sản phẩm ${productSku.product_name} đã hết hàng`);
      }
      await knex("Products_skus")
        .where({ id: item.id })
        .update({ quantity: newQuantity });
    }

    // Xóa các mục trong giỏ hàng của người dùng sau khi đặt hàng thành công
    await knex("CartItem").where({ cart_id: userId }).del();

    return {
      success: true,
      message: "Đặt hàng thành công",
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = { createOrder };
