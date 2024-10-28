const knex = require("../config/database").db;
const cartService = require("./cartServices");
const { getUserById } = require("./userServices");
const mailSender = require("../utils/mailSender");
const createOrder = async (
  userId,
  cartItems,
  selectedAddress,
  paymentId,
  couponId,
  total
) => {
  try {
    // Get user information
    const user = await knex("User").where({ id: userId }).first();
    console.log("user", user);

    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    // Create order first to get the order ID
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

    const orderItems = [];
    // Process cart items and update inventory
    for (const item of cartItems) {
      const productSku = await knex("Products_skus")
        .select("Products_skus.*", "Product.name as product_name")
        .join("Product", "Products_skus.product_id", "=", "Product.id")
        .where("Products_skus.id", item.id)
        .first();

      if (!productSku) {
        throw new Error(`Sản phẩm với SKU ${item.id} không tồn tại`);
      }

      // Store order item for email
      orderItems.push({
        name: productSku.product_name,
        sku: productSku.sku,
        quantity: item.quantity,
        price: productSku.price,
        image: productSku.product_image,
      });

      // Insert order item
      await knex("OrderItem").insert({
        order_id: order,
        product_id: productSku.id,
        name: productSku.sku,
        quantity: item.quantity,
        price: productSku.price,
      });

      // Update inventory
      const newQuantity = productSku.quantity - item.quantity;
      if (newQuantity < 0) {
        throw new Error(`Sản phẩm ${productSku.product_name} đã hết hàng`);
      }
      await knex("Products_skus")
        .where({ id: item.id })
        .update({ quantity: newQuantity });
    }

    // Clear cart after successful order
    await knex("CartItem").where({ cart_id: userId }).del();

    // Format the date
    const orderDate = new Date().toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Format currency
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(amount);
    };

    // Create HTML email template
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          border-radius: 5px;
        }
        .order-info {
          margin: 20px 0;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .product-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .product-table th, .product-table td {
          padding: 10px;
          border: 1px solid #ddd;
          text-align: left;
        }
        .product-table th {
          background-color: #f8f9fa;
        }
        .total {
          font-size: 18px;
          font-weight: bold;
          text-align: right;
          margin-top: 20px;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Xác nhận đơn hàng từ A&L Shop</h2>
          <p>Mã đơn hàng: #${order}</p>
        </div>
        
        <p>Chào ${user.first_name} ${user.last_name},</p>
        <p>Cảm ơn bạn đã đặt hàng! Dưới đây là thông tin chi tiết đơn hàng của bạn:</p>
        
        <div class="order-info">
          <p><strong>Ngày đặt hàng:</strong> ${orderDate}</p>
          <p><strong>Địa chỉ giao hàng:</strong> ${selectedAddress}</p>
          <p><strong>Phương thức thanh toán:</strong> ${
            paymentId === 1 ? "Thanh toán khi nhận hàng" : "Thanh toán online"
          }</p>
          <p><strong>Trạng thái:</strong> Đang chờ xác nhận</p>
        </div>

        <table class="product-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Số lượng</th>
              <th>Đơn giá</th>
              <th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${orderItems
              .map(
                (item) => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${formatCurrency(item.price * item.quantity)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <div class="total">
          <p>Phí vận chuyển: ${formatCurrency(30000)}</p>
          ${couponId ? `<p>Giảm giá: ${formatCurrency(50000)}</p>` : ""}
          ${paymentId === 1 ? `<p>Giảm giá: ${formatCurrency(50000)}</p>` : ""}
          <p>Tổng cộng: ${formatCurrency(total - (couponId ? 50000 : 0) - (paymentId === 1 ? 50000 : 0) + 30000)}</p>
        </div>
        <div class="footer">
          <p>Đơn hàng sẽ được giao trong khoảng 3 - 7 ngày, tùy thuộc vào khu vực của bạn.</p>
          <p>Cảm ơn bạn đã mua sắm tại A&L Shop!</p>
          <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email: support@alshop.com</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const email = "voongocminan20072002@gmail.com";
    const mailResponse = await mailSender(
      email,
      "Xác nhận đơn hàng từ A&L shop",
      emailHtml
    );

    console.log("Email sent successfully: ", mailResponse);
    return {
      success: true,
      message: "Đặt hàng thành công",
    };
  } catch (error) {
    console.error("Error creating order:", error);
    throw new Error(error.message);
  }
};

const getOrdersWithDetails = async (userId) => {
  const orders = await knex("Order")
    .where({ customer_id: userId })
    .select("*")
    .orderBy("created_at", "desc");

  const orderDetails = await Promise.all(
    orders.map(async (order) => {
      const items = await knex("OrderItem")
        .where({ order_id: order.id })
        .select("product_id", "name", "quantity", "price");
      return {
        ...order,
        items, // Thêm thông tin chi tiết sản phẩm vào đơn hàng
      };
    })
  );

  // Phân loại đơn hàng theo trạng thái
  const result = {
    complete: [],
    nonComplete: [],
  };

  orderDetails.forEach((order) => {
    if (order.status === "Delivered") {
      result.complete.push(order); // Lịch sử mua hàng
    } else {
      result.nonComplete.push(order); // Thông tin đơn hàng
    }
  });

  return result; // Trả về đối tượng với thông tin đầy đủ
};

module.exports = { createOrder, getOrdersWithDetails };