const knex = require("../config/database").db;

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
    const orderInsert = {
      address: selectedAddress,
      coupon_id: couponId ? couponId : null,
      created_at: new Date(),
      customer_id: userId,
      payment_id: paymentId,
      shipping_fee: 30000,
      status: "Pending Confirmation",
      total,
    };
    console.log(orderInsert);

    // Tạo đơn hàng
    const order = await knex("Order").insert(orderInsert).returning("*");
    console.log("order", order);
    
    // Tạo các mục trong đơn hàng
    for (const item of cartItems) {
    console.log('cartItems',cartItems);
    
      const productSku = await knex("Products_skus")
        .select("Products_skus.*", "Product.name as product_name")
        .join("Product", "Products_skus.product_id", "=", "Product.id")
        .where("Products_skus.id", item.id)
        .first(); 

        console.log("Retrieved Product SKU:", productSku);

      await knex("OrderItem").insert({
        order_id: order, // ID của đơn hàng vừa tạo
        product_id: productSku.id,
        name: productSku.sku,
        quantity: item.quantity,
        price: productSku.price,
      });

      //   // Giảm số lượng trong kho
      //   const productSku = await knex("Products_skus")
      //     .where({ id: item.product_sku_id })
      //     .first();
      //   if (productSku) {
      //     const newQuantity = productSku.quantity - item.quantity;
      //     await knex("Products_skus")
      //       .where({ id: item.product_sku_id })
      //       .update({ quantity: newQuantity });
      //   }
    }

    // Xóa các mục trong giỏ hàng sau khi đặt hàng thành công
    await knex("CartItem").where({ cart_id: userId }).del();

    return {
      success: true,
      message: "Đặt hàng thành công",
      orderId: order[0].id,
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = { createOrder };
