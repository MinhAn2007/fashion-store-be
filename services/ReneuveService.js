const knex = require("../config/database").db;

const getDashboardOverview = async (
  startDateTime = null,
  endDateTime = null
) => {
  try {
    const startDate = startDateTime
      ? new Date(startDateTime).toISOString()
      : null;
    const endDate = endDateTime ? new Date(endDateTime).toISOString() : null;

    let totalRevenueQuery = knex("Order").select(
      knex.raw("SUM(total) AS total_revenue")
    ).where("status", "Completed");

    let totalOrdersQuery = knex("Order").count("id as total_orders").where("status", "Completed");

    let averageOrderValueQuery = knex("Order").avg(
      "total as average_order_value"
    ).where("status", "Completed");

    let monthlyRevenueQuery = knex("Order").select(
      knex.raw("DATE_FORMAT(created_at, '%Y-%m') AS month"),
      knex.raw("SUM(total) AS revenue")
    ).where("status", "Completed");

    let salesByCategoryQuery = knex("OrderItem ")
      .join("Order", "OrderItem.order_id", "Order.id")
      .join("Product", "OrderItem.product_id", "Product.id")
      .join("Category", "Product.category_id", "Category.id")
      .select(
        "Category.name",
        "Category.id",
        "Category.parent_id",
        knex.raw("SUM(Product.sold) as total_quantity"),

        knex.raw("SUM(OrderItem.price * OrderItem.quantity) as category_sales")
      )
      .where("Order.status", "Completed")
      .groupBy("Category.id");
    // Add date filtering if start and end dates are provided
    if (startDate && endDate) {
      totalRevenueQuery = totalRevenueQuery
        .where("created_at", ">=", startDate)
        .where("created_at", "<=", endDate);

      totalOrdersQuery = totalOrdersQuery
        .where("created_at", ">=", startDate)
        .where("created_at", "<=", endDate);

      averageOrderValueQuery = averageOrderValueQuery
        .where("created_at", ">=", startDate)
        .where("created_at", "<=", endDate);

      monthlyRevenueQuery = monthlyRevenueQuery
        .where("created_at", ">=", startDate)
        .where("created_at", "<=", endDate);

      salesByCategoryQuery = salesByCategoryQuery
        .where("OrderItem.created_at", ">=", startDate)
        .where("OrderItem.created_at", "<=", endDate);
    }

    // Execute queries
    const [
      totalRevenueResult,
      totalOrdersResult,
      averageOrderValueResult,
      monthlyRevenue,
      salesByCategory,
    ] = await Promise.all([
      totalRevenueQuery.first(),
      totalOrdersQuery.first(),
      averageOrderValueQuery.first(),
      monthlyRevenueQuery
        .groupBy(knex.raw("DATE_FORMAT(created_at, '%Y-%m')"))
        .orderBy("month"),
      salesByCategoryQuery
        .groupBy("Category.id", "Category.name")
        .orderBy("category_sales", "desc"),
    ]);

    // Calculate growth rates
    const growthRates = calculateMonthlyGrowth(monthlyRevenue);
    salesByCategory.forEach((category) => {
      category.total_quantity = parseInt(category.total_quantity);
    });
    return {
      stats: {
        totalRevenue: parseFloat(totalRevenueResult.total_revenue || 0),
        totalOrders: parseInt(totalOrdersResult.total_orders || 0),
        averageOrderValue: parseFloat(
          averageOrderValueResult.average_order_value || 0
        ),
      },
      monthlyRevenue,
      salesByCategory,
      growthRates,
    };
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    throw new Error("Lỗi khi lấy dữ liệu dashboard");
  }
};

// Utility function to calculate monthly growth rates
const calculateMonthlyGrowth = (monthlyRevenue) => {
  const growthRates = [];
  for (let i = 1; i < monthlyRevenue.length; i++) {
    const prevRevenue = parseFloat(monthlyRevenue[i - 1].revenue);
    const currentRevenue = parseFloat(monthlyRevenue[i].revenue);

    const growthRate =
      prevRevenue > 0
        ? (((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(2)
        : 0;

    growthRates.push({
      month: monthlyRevenue[i].month,
      growthRate: parseFloat(growthRate),
    });
  }
  return growthRates;
};

module.exports = {
  getDashboardOverview,
};
