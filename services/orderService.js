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
      // Insert order order
      await trx("OrderItem").insert({
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
  const trx = await knex.transaction();

  try {
    // Get order details
    const order = await trx("Order").where({ id: orderId }).first();

    if (!order) {
      throw new Error("Đơn hàng không tồn tại");
    }

    // Get user details
    const user = await trx("User").where({ id: order.customer_id }).first();

    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    // Get order items for email template
    const orderItems = await trx("OrderItem")
      .where({ order_id: orderId })
      .join("Products_skus", "OrderItem.product_id", "=", "Products_skus.id")
      .join("Product", "Products_skus.product_id", "=", "Product.id")
      .select(
        "OrderItem.*",
        "Product.name as product_name",
        "Products_skus.image"
      );

    // Update order status and timestamp
    const statusTime = mappingStatusTime(status);
    await trx("Order")
      .where({ id: orderId })
      .update({
        status,
        [statusTime]: new Date(),
      });

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
        .status-update {
          font-weight: bold;
          color: #007bff;
          text-align: center;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Cập nhật trạng thái đơn hàng A&L Shop</h2>
          <p>Mã đơn hàng: #${orderId}</p>
        </div>
        
        <p>Chào ${user.first_name} ${user.last_name},</p>
        
        <div class="status-update">
          <h3>Trạng thái đơn hàng đã được cập nhật:</h3>
          <p>${status}</p>
        </div>
        
        <div class="order-info">
          <p><strong>Ngày cập nhật:</strong> ${orderDate}</p>
        </div>

        <table class="product-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Số lượng</th>
              <th>Đơn giá</th>
            </tr>
          </thead>
          <tbody>
            ${orderItems
              .map(
                (item) => `  
              <tr>
                <td>${item.product_name}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.price)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email: support@alshop.com</p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Send email
    await mailSender(
      user.email,
      `Cập nhật trạng thái đơn hàng #${orderId}`,
      emailHtml
    );

    // Commit the transaction
    await trx.commit();

    return {
      success: true,
      message: "Đã cập nhật trạng thái đơn hàng và gửi email thông báo",
    };
  } catch (error) {
    // Rollback transaction in case of error
    await trx.rollback();
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

const getDashboardDetails = async () => {
  return await knex.transaction(async (trx) => {
    const monthlyRevenue = await trx
      .select(
        knex.raw("DATE_FORMAT(o.created_at, '%Y-%m') AS month"),
        knex.raw("SUM(oi.quantity * oi.price) AS total_revenue")
      )
      .from("Order as o")
      .join("OrderItem as oi", "o.id", "=", "oi.order_id")
      .where("o.status", "Completed")
      .groupBy(knex.raw("DATE_FORMAT(o.created_at, '%Y-%m')"))
      .orderBy("month");

    // knex("OrderItem ")
    // .join("Order", "OrderItem.order_id", "Order.id")
    // .join("Product", "OrderItem.product_id", "Product.id")
    // .join("Category", "Product.category_id", "Category.id")
    // .select(
    //   "Category.name",
    //   "Category.id",
    //   "Category.parent_id",
    //   knex.raw("SUM(quantity * price) as category_sales")
    // )
    // .where("Order.status", "Completed")
    // .groupBy("Category.id");
    const monthlyQuantity = await trx
      .select(
        "c.name as category_name",
        "c.id as id",
        "c.parent_id as parent_id",
        knex.raw("SUM(p.sold) AS total_sold")
      )
      .from("Category as c")
      .leftJoin("Product as p", "c.id", "=", "p.category_id")
      .leftJoin("OrderItem as oi", "p.id", "=", "oi.product_id")
      .leftJoin("Order as o", "oi.order_id", "=", "o.id")

      .where("o.status", "Completed")
      .groupBy("c.id")
      .orderByRaw("total_sold DESC");

    console.log(monthlyQuantity);

    const bestSellingProducts = await trx
      .select(
        "p.name AS product_name",
        knex.raw("SUM(oi.quantity) AS total_quantity_sold")
      )
      .from("OrderItem as oi")
      .join("Product as p", "oi.product_id", "=", "p.id")
      .join("Order as o", "oi.order_id", "=", "o.id")
      .where("o.status", "Completed")
      .groupBy("p.id")
      .orderBy("total_quantity_sold", "desc")
      .limit(4);

    return {
      monthlyRevenue,
      monthlyQuantity,
      bestSellingProducts,
    };
  });
};

const getDashboardTotals = async () => {
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

    const activities = await knex
      .select(
        knex.raw(`* FROM (
      SELECT 
        'Đơn hàng' as type, 
        id,
        created_at,
        CONCAT('Đơn hàng mới #', id, ' - ', 
          CASE status
            WHEN 'Pending Confirmation' THEN 'Chờ xác nhận'
            WHEN 'Completed' THEN 'Đã hoàn thành'
            WHEN 'Cancelled' THEN 'Đã hủy'
            WHEN 'Returned' THEN 'Đã trả hàng'
            WHEN 'In Transit' THEN 'Đang giao hàng'
            ELSE 'Đã giao hàng'
          END,
          ' - ', total, ' VNĐ') as description
      FROM \`Order\`
   
      UNION ALL 
   
      SELECT 
        'Đánh giá' as type,
        id, 
        created_at,
        CONCAT('Đánh giá mới #', id, ' - ', rating, ' sao - ', title) as description
      FROM Review
   
      UNION ALL
   
      SELECT 
        'Sản phẩm' as type,
        id,
        created_at, 
        CONCAT('Sản phẩm mới #', id, ' - ', name) as description
      FROM Product
   
      UNION ALL
   
      SELECT 
        'Người dùng' as type,
        id,
        created_at,
        CONCAT('Người dùng mới #', id, ' - ', first_name, ' ', last_name) as description  
      FROM User
   
      UNION ALL
   
      SELECT 
        'SKU' as type,
        id,
        created_at,
        CONCAT('SKU mới #', id, ' - Size: ', size, ' - Màu: ', color) as description
      FROM Products_skus
    ) as activities`)
      )
      .orderBy("created_at", "desc")
      .limit(3);

    const orderNeedAction = await knex("Order")
      .select("*")
      .where("Order.status", "Pending Confirmation")
      .orWhere("Order.status", "Returned")
      .orderBy("Order.created_at", "desc")
      .limit(3);
    return {
      totalSales: totalSales.totalSales || 0,
      productsSold: productsSold.productsSold || 0,
      newCustomers: newCustomers.newCustomers || 0,
      totalOrders: totalOrders.totalOrders || 0,
      activities,
      orderNeedAction,
    };
  } catch (error) {
    console.error("Error getting dashboard totals:", error);
    throw new Error(error.message);
  }
};

const getOrderDashboard = async (startDateTime = null, endDateTime = null) => {
  try {
    const startDate = startDateTime
      ? new Date(startDateTime).toISOString()
      : null;
    const endDate = endDateTime ? new Date(endDateTime).toISOString() : null;
    console.log(startDate);
    console.log(endDate);
    let ordersQuery = knex("Order")
      .select(
        "Order.id",
        "User.first_name",
        "User.last_name",
        "Order.status",
        "Order.total",
        "Order.created_at"
      )
      .join("User", "Order.customer_id", "User.id");

    let monthlyRevenueQuery = knex
      .select(
        knex.raw("DATE_FORMAT(created_at, '%Y-%m') AS month"),
        knex.raw("SUM(total) AS total_revenue")
      )
      .from("Order");

    let categoryStatsQuery = knex
      .select(
        "Category.name as category_name",
        "Category.id",
        "Category.parent_id",
        knex.raw("SUM(Product.sold) AS total_sold")
      )
      .from("Category")
      .leftJoin("Product", "Category.id", "=", "Product.category_id");

    let paymentStatsQuery = knex("Order")
      .select("Payment.payment_method")
      .count("Order.id as count")
      .join("Payment", "Order.payment_id", "Payment.id");

    // Add date filtering if start and end dates are provided
    if (startDate && endDate) {
      ordersQuery = ordersQuery
        .where("Order.created_at", ">=", startDate)
        .where("Order.created_at", "<=", endDate);

      monthlyRevenueQuery = monthlyRevenueQuery
        .where("created_at", ">=", startDate)
        .where("created_at", "<=", endDate);

      categoryStatsQuery = categoryStatsQuery.whereExists(
        knex
          .select("*")
          .from("Product")
          .whereRaw("Product.category_id = Category.id")
          .whereExists(
            knex
              .select("*")
              .from("OrderItem")
              .join("Order", "OrderItem.order_id", "Order.id")
              .whereRaw("OrderItem.product_id = Product.id")
              .where("Order.created_at", ">=", startDate)
              .where("Order.created_at", "<=", endDate)
          )
      );

      paymentStatsQuery = paymentStatsQuery
        .where("Order.created_at", ">=", startDate)
        .where("Order.created_at", "<=", endDate);
    }

    // Execute queries
    const orders = await ordersQuery.orderBy("Order.created_at", "desc");
    const monthlyRevenue = await monthlyRevenueQuery
      .groupBy(knex.raw("DATE_FORMAT(created_at, '%Y-%m')"))
      .orderBy("month");
    const categoryStats = await categoryStatsQuery
      .groupBy("Category.id")
      .orderBy("total_sold", "desc");
    const paymentStats = await paymentStatsQuery.groupBy(
      "Payment.payment_method"
    );

    // Calculate statistics
    const totalRevenue = orders.reduce(
      (sum, order) => sum + parseInt(order.total),
      0
    );
    const returnedOrders = orders.filter(
      (order) => order.status === "Returned"
    );
    const returnRate =
      orders.length > 0
        ? ((returnedOrders.length / orders.length) * 100).toFixed(2)
        : 0;
    const pendingOrders = orders.filter(
      (order) => order.status === "Pending Confirmation"
    ).length;

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      customerName: `${order.first_name} ${order.last_name}`,
      status: order.status,
      total: order.total,
      createdAt: order.created_at,
    }));

    const total = paymentStats.reduce(
      (sum, item) => sum + parseInt(item.count),
      0
    );
    const formattedPaymentStats = paymentStats.map((item) => ({
      name: item.payment_method === "ONLINE" ? "Thanh toán Online" : "Tiền mặt",
      value:
        total > 0 ? parseFloat(((item.count / total) * 100).toFixed(2)) : 0,
    }));

    return {
      stats: {
        totalRevenue,
        returnRate,
        pendingOrders,
        totalOrders: orders.length,
      },
      monthlyRevenue,
      categoryStats,
      paymentStats: formattedPaymentStats,
      orders: formattedOrders,
    };
  } catch (error) {
    throw new Error("Lỗi khi lấy dữ liệu dashboard");
  }
};

const getOrderDetails = async (orderId) => {
  try {
    // Fetch the order with all necessary details

    const order = await knex("Order")
      .select("Order.*", "User.first_name", "User.last_name", "User.email")
      .join("User", "Order.customer_id", "=", "User.id")
      .where("Order.id", orderId)
      .first();

    if (!order) {
      throw new Error("Đơn hàng không tồn tại");
    }

    // Fetch order items with product details
    const items = await knex("OrderItem")
      .select(
        "OrderItem.*",
        "Products_skus.size",
        "Products_skus.color",
        "Products_skus.image",
        "Product.name"
      )
      .join("Products_skus", "OrderItem.product_id", "=", "Products_skus.id")
      .join("Product", "Products_skus.product_id", "=", "Product.id")
      .where("OrderItem.order_id", orderId);

    // Calculate shipping and discounts
    const shippingFee = 30000;
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const createdAt = new Date(order.created_at);
    const estimatedDelivery = new Date(createdAt);
    estimatedDelivery.setDate(createdAt.getDate() + 5);

    // Fetch payment method
    const payment = await knex("Payment").where("id", order.payment_id).first();

    const updateAt = mappingStatusTime(order.status);

    return {
      id: order.id,
      status: order.status,
      customerName: `${order.first_name} ${order.last_name}`,
      email: order.email,
      phone: order.phone_number,
      address: order.address,
      createdAt: order.created_at,
      updatedAt: order[updateAt],
      paymentMethod: payment ? payment.payment_method : "Unknown",
      shipping: {
        method: "Express",
        fee: shippingFee,
        estimatedDelivery: estimatedDelivery.toISOString(),
      },
      items: items.map((item) => ({
        id: item.product_id,
        name: item.name,
        sku: item.sku,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image: item.image,
      })),
      subtotal,
      returnReason: order.return_reason,
      cancelReason: order.cancel_reason,
      shippingFee: parseInt(order.shipping_fee),
      discount: order.payment_id === 0 ? 50000 : 0,
      total: order.total,
    };
  } catch (error) {
    console.error("Error fetching order details:", error);
    throw new Error(error.message);
  }
};

module.exports = {
  createOrder,
  getOrdersWithDetails,
  cancelOrder,
  updateOrderStatus,
  returnOrder,
  getDashboardTotals,
  getDashboardDetails,
  getOrderDashboard,
  getOrderDetails,
};
