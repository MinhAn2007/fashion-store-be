const knex = require("../config/database").db;
const cartService = require("./cartServices");
const { getUserById } = require("./userServices");
const mailSender = require("../utils/mailSender");
const { mappingStatusTime } = require("../constants/status");
const createOrder = async (
  userId,
  cartItems,
  selectedAddress,
  paymentId,
  couponId,
  total
) => {
  const trx = await knex.transaction(); // Bắt đầu giao dịch

  try {
    // Get user information
    const user = await trx("User").where({ id: userId }).first();
    console.log("user", user);

    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    // Remove items from cart
    for (const item of cartItems) {
      await cartService.removeCartItem(userId, item.id, trx); // Cần truyền trx vào nếu hàm này hỗ trợ giao dịch
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

    // Insert order
    const [order] = await trx("Order").insert(orderInsert).returning("*");

    const orderItems = [];
    // Process cart items and update inventory
    for (const item of cartItems) {
      const productSku = await trx("Products_skus")
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
      await trx("OrderItem").insert({
        order_id: order.id,
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
      await trx("Products_skus")
        .where({ id: item.id })
        .update({ quantity: newQuantity });
      console.log("productSku", productSku.sold);
      console.log("item", item.quantity);

      await trx("Product")
        .where({ id: productSku.product_id })
        .increment("sold", item.quantity);
    }

    // Clear cart after successful order
    await trx("CartItem").where({ cart_id: userId }).del();

    // Commit the transaction
    await trx.commit();

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
          <p>Mã đơn hàng: #${order.id}</p>
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
          ${
            paymentId === 1
              ? `<p>Giảm giá qua thanh toán online: ${formatCurrency(
                  50000
                )}</p>`
              : ""
          }
          <p>Tổng cộng: ${formatCurrency(total)}</p>
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
    const email = user.email;
    console.log("Email to send:", email);

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
    await trx.rollback(); // Rollback giao dịch nếu có lỗi
    console.error("Error creating order:", error);
    throw new Error(error.message);
  }
};

const getOrdersWithDetails = async (userId) => {
  try {
    const orders = await knex("Order")
      .where({ customer_id: userId })
      .select("*")
      .orderBy("created_at", "desc");

    const orderDetails = await Promise.all(
      orders.map(async (order) => {
        const items = await knex("OrderItem")
          .where({ order_id: order.id })
          .join(
            "Products_skus",
            "OrderItem.product_id",
            "=",
            "Products_skus.id"
          )
          .join("Product", "Products_skus.product_id", "=", "Product.id")
          .select(
            "OrderItem.*",
            "OrderItem.price as cartItemPrice",
            "Products_skus.id as id",
            "Products_skus.product_id as productId",
            "Products_skus.sku",
            "Products_skus.price as skuPrice",
            "Products_skus.quantity as stockQuantity",
            "Products_skus.size",
            "Products_skus.color",
            "Products_skus.image",
            "Product.name as product_name"
          );

        // Thêm thuộc tính availability cho từng sản phẩm
        const itemsWithAvailability = items.map((item) => ({
          ...item,
          isInStock: item.stockQuantity > 0, // Cập nhật điều kiện
          checked: true,
        }));

        // Kiểm tra xem đơn hàng đã có đánh giá chưa
        const isReview = await knex("Review")
          .where({ order_id: order.id })
          .first();

        return {
          ...order,
          items: itemsWithAvailability,
          isReview: Boolean(isReview),
        };
      })
    );

    const result = {
      complete: [],
      nonComplete: [],
    };

    orderDetails.forEach((order) => {
      // Tính tổng số sản phẩm có sẵn trong đơn hàng
      const totalAvailableItems = order.items
        .filter((item) => item.isInStock)
        .reduce((acc, item) => acc + item.quantity, 0);

      const orderWithAvailability = {
        ...order,
        totalAvailableItems,
      };

      // Phân loại đơn hàng theo trạng thái
      if (
        order.status === "Completed" ||
        order.status === "Cancelled" ||
        order.status === "Returned"
      ) {
        result.complete.push(orderWithAvailability);
      } else {
        result.nonComplete.push(orderWithAvailability);
      }
    });

    return result;
  } catch (error) {
    console.error("Error in getOrdersWithDetails:", error);
    throw new Error("Error fetching order details");
  }
};

const cancelOrder = async (orderId, cancellationReason) => {
  try {
    // Lấy thông tin đơn hàng trước khi hủy
    const order = await knex("Order").where({ id: orderId }).first();

    if (!order) {
      throw new Error("Đơn hàng không tồn tại");
    }

    if (order.status === "Cancelled") {
      throw new Error("Đơn hàng đã được hủy trước đó");
    }

    // Cập nhật trạng thái đơn hàng thành 'Cancelled' và thêm lý do, thời gian hủy
    await knex("Order").where({ id: orderId }).update({
      status: "Cancelled",
      canceled_at: new Date(),
      cancel_reason: cancellationReason, // Ghi lý do hủy
    });

    // Khôi phục lại lượng sản phẩm trong kho
    const orderItems = await knex("OrderItem").where({ order_id: orderId });
    for (const item of orderItems) {
      const productSku = await knex("Products_skus")
        .where({ id: item.product_id })
        .first();

      if (productSku) {
        const newQuantity = productSku.quantity + item.quantity; // Khôi phục lại số lượng
        await knex("Products_skus")
          .where({ id: item.product_id })
          .update({ quantity: newQuantity });
      }
      await knex("Product").update({ sold: +item.quantity });
    }

    return {
      success: true,
      message: "Hủy đơn hàng thành công",
    };
  } catch (error) {
    console.error("Error cancelling order:", error);
    throw new Error(error.message);
  }
};

const updateOrderStatus = async (orderId, status) => {
  try {
    const statusTime = mappingStatusTime(status);
    await knex("Order")
      .where({ id: orderId })
      .update({ status, [statusTime]: new Date() });

    return {
      success: true,
      message: "Đã cập nhật trạng thái đơn hàng",
    };
  } catch (error) {
    console.error("Error updating order status:", error);
    throw new Error(error.message);
  }
};

const returnOrder = async (orderId, returnReason) => {
  try {
    // Lấy thông tin đơn hàng trước khi hủy
    const order = await knex("Order").where({ id: orderId }).first();

    if (!order) {
      throw new Error("Đơn hàng không tồn tại");
    }

    if (order.status === "Returned") {
      throw new Error("Đơn hàng đã được trả trước đó");
    }

    // Cập nhật trạng thái đơn hàng thành 'Returned' và thêm lý do, thời gian trả

    await knex("Order").where({ id: orderId }).update({
      status: "Returned",
      returned_at: new Date(),
      return_reason: returnReason, // Ghi lý do trả
    });
    const orderItems = await knex("OrderItem").where({ order_id: orderId });
    for (const item of orderItems) {
      const productSku = await knex("Products_skus")
        .where({ id: item.product_id })
        .first();

      if (productSku) {
        const newQuantity = productSku.quantity + item.quantity; // Khôi phục lại số lượng
        await knex("Products_skus")
          .where({ id: item.product_id })
          .update({ quantity: newQuantity });
      }
    }
  } catch (error) {
    console.error("Error returning order:", error);
    throw new Error(error.message);
  }
};

const getOrderDashboard = async () => {
  try {
    const totalSales = await knex("Order")
      .where({ status: "Completed" })
      .sum("total as totalSales")
      .first();

    const productsSold = await knex("Product")
      .sum("sold as productsSold")
      .first();

    const newCustomers = await knex("User").count("id as newCustomers").first();

    const totalOrders = await knex("Order").count("id as totalOrders").first();

    const monthlyRevenue = await knex("Order")
      .select(
        knex.raw("MONTH(created_at) as month"),
        knex.raw("SUM(total) as revenue")
      )
      .where({ status: "Completed" })
      .groupByRaw("MONTH(created_at)")
      .orderBy("month", "asc");

    const lineData = monthlyRevenue.map((item) => ({
      month: item.month,
      revenue: item.revenue,
    }));

    const productSalesData = await knex("Product")
      .join("Category", "Product.category_id", "=", "Category.id")
      .select(
        knex.raw("COALESCE(Category.parent_id, Category.id) as category_id"),
        knex.raw("SUM(Product.sold) as sales"),
        "Category.name as name"
      )
      .where("Category.parent_id", null)
      .groupByRaw("COALESCE(Category.parent_id, Category.id), Category.name")
      .orderBy("sales", "desc");

    const barData = productSalesData.map((item) => ({
      product: item.name,
      sales: item.sales,
    }));

    const monthlyOrders = await knex("Order")
      .select(
        knex.raw("MONTH(created_at) as month"),
        knex.raw("COUNT(id) as orders")
      )
      .where({ status: "Completed" })
      .groupByRaw("MONTH(created_at)")
      .orderBy("month", "asc");

    const orderData = monthlyOrders.map((item) => ({
      month: item.month,
      orders: item.orders,
    }));

    const bestSellingProducts = await knex("Product")
      .select("id", "name", "sold")
      .orderBy("sold", "desc")
      .limit(4);

    const bestSellingProductsData = await Promise.all(
      bestSellingProducts.map(async (item) => {
        const avgRating = await knex("Review")
          .avg("rating as avgRating")
          .where({ product_id: item.id })
          .first();

        return {
          name: item.name,
          sold: item.sold,
          avgRating: avgRating.avgRating || 0,
        };
      })
    );

    return {
      totalSales: totalSales.totalSales || 0,
      productsSold: productsSold.productsSold || 0,
      newCustomers: newCustomers.newCustomers || 0,
      totalOrders: totalOrders.totalOrders || 0,
      lineData,
      barData,
      orderData,
      bestSellingProductsData,
    };
  } catch (error) {
    console.error("Error getting order dashboard:", error);
    throw new Error(error.message);
  }
};

module.exports = {
  createOrder,
  getOrdersWithDetails,
  cancelOrder,
  updateOrderStatus,
  returnOrder,
  getOrderDashboard,
};
