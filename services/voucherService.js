const knex = require("../config/database").db;

const createPromotion = async (data) => {
  try {
    const voucher = await knex("Coupon").insert({
      ...data,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    });
    return voucher;
  } catch (error) {
    console.error("Error creating promotion:", error);
    throw new Error("Lỗi khi tạo khuyến mãi mới");
  }
};

const updatePromotion = async (id, data) => {
  try {
    const voucher = await knex("Coupon")
      .where({ id })
      .update({
        ...data,
        updated_at: knex.fn.now(),
      });
    return voucher;
  } catch (error) {
    console.error("Error updating promotion:", error);
    throw new Error("Lỗi khi cập nhật khuyến mãi");
  }
};

const deletePromotion = async (id) => {
  try {
    await knex("Coupon").where({ id }).update({
      deleted_at: knex.fn.now(),
      coupon_status: "disabled",
    });
    return { message: "Khuyến mãi đã được xóa" };
  } catch (error) {
    console.error("Error deleting promotion:", error);
    throw new Error("Lỗi khi xóa khuyến mãi");
  }
};

const getPromotionDashboardData = async () => {
  try {
    // Get all active coupons
    const promotions = await knex("Coupon").select([
      "id",
      "coupon_code",
      "coupon_type",
      "coupon_value",
      "coupon_start_date",
      "coupon_end_date",
      "coupon_min_spend",
      "coupon_max_spend",
      "coupon_uses_per_customer",
      "coupon_uses_per_coupon",
      "coupon_status",
    ]);

    // Get usage statistics from Order table
    const usageStats = await knex("Order")
      .select("coupon_id")
      .whereNotNull("coupon_id")
      .count("* as total_uses")
      .sum("total as order_total") // Total order value
      .groupBy("coupon_id");

    // Calculate total discount for each coupon based on its type and value
    const promotionsWithStats = await Promise.all(
      promotions.map(async (promo) => {
        const stats = usageStats.find(
          (stat) => stat.coupon_id === promo.id
        ) || {
          total_uses: 0,
          order_total: 0,
        };

        // Calculate total discount based on coupon type
        let total_discount = 0;
        if (stats.total_uses > 0) {
          if (promo.coupon_type === "percent") {
            total_discount = (stats.order_total * promo.coupon_value) / 100;
          } else if (promo.coupon_type === "fixed_amount") {
            total_discount = promo.coupon_value * parseInt(stats.total_uses);
          }
        }

        // Get current status if not already set
        const now = new Date();
        const startDate = new Date(promo.coupon_start_date);
        const endDate = new Date(promo.coupon_end_date);

        let status = promo.coupon_status;
        if (!status) {
          if (now >= startDate && now <= endDate) {
            status = "active";
          } else if (now > endDate) {
            status = "expired";
          } else {
            status = "inactive";
          }
        }

        return {
          ...promo,
          total_uses: parseInt(stats.total_uses),
          total_discount: parseFloat(total_discount.toFixed(2)),
          status,
        };
      })
    );

    // Get chart data for the last 6 months
    const chartData = await knex("Order")
      .select(
        knex.raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
        knex.raw("COUNT(DISTINCT id) as total_uses"),
        knex.raw("SUM(total) as order_total")
      )
      .whereNotNull("coupon_id")
      .where(
        "created_at",
        ">=",
        knex.raw("DATE_SUB(CURDATE(), INTERVAL 6 MONTH)")
      )
      .groupBy(knex.raw("DATE_FORMAT(created_at, '%Y-%m')"))
      .orderBy("month", "asc");

    // Format chart data with calculated discounts
    const formattedChartData = await Promise.all(
      chartData.map(async (item) => {
        // Get all orders for this month to calculate accurate discounts
        const monthOrders = await knex("Order")
          .select("coupon_id", "total")
          .whereNotNull("coupon_id")
          .whereRaw("DATE_FORMAT(created_at, '%Y-%m') = ?", [item.month]);

        // Calculate total discount for the month
        let monthlyDiscount = 0;
        for (const order of monthOrders) {
          const coupon = promotions.find((p) => p.id === order.coupon_id);
          if (coupon) {
            if (coupon.coupon_type === "percent") {
              monthlyDiscount += (order.total * coupon.coupon_value) / 100;
            } else if (coupon.coupon_type === "fixed_amount") {
              monthlyDiscount += coupon.coupon_value;
            }
          }
        }

        return {
          month: new Date(item.month).toLocaleString("default", {
            month: "short",
          }),
          total_uses: parseInt(item.total_uses),
          total_discount: parseFloat(monthlyDiscount.toFixed(2)),
        };
      })
    );

    return {
      promotions: promotionsWithStats,
      chartData: formattedChartData,
      mostUsedPromotions: [...promotionsWithStats]
        .sort((a, b) => b.total_uses - a.total_uses)
        .slice(0, 5),
      highestDiscountPromotions: [...promotionsWithStats]
        .sort((a, b) => b.total_discount - a.total_discount)
        .slice(0, 5),
    };
  } catch (error) {
    console.error("Error fetching promotion dashboard data:", error);
    throw new Error("Lỗi khi lấy dữ liệu dashboard khuyến mãi");
  }
};

const checkVoucher = async (code, totalAmount) => {
  try {
    const voucher = await knex("Coupon")
      .where({ coupon_code: code })
      .whereNull("deleted_at")
      .first();

    if (!voucher) {
      return {
        valid: false,
        message: "Mã giảm giá không tồn tại",
      };
    }

    const now = new Date();
    const startDate = new Date(voucher.coupon_start_date);
    const endDate = new Date(voucher.coupon_end_date);

    // Kiểm tra thời gian hiệu lực
    if (now < startDate || now > endDate) {
      return {
        valid: false,
        message: "Mã giảm giá đã hết hạn hoặc chưa có hiệu lực",
      };
    }

    // Kiểm tra trạng thái
    if (voucher.coupon_status !== "active") {
      return {
        valid: false,
        message: "Mã giảm giá không còn hiệu lực",
      };
    }

    // Kiểm tra điều kiện đơn hàng tối thiểu
    if (totalAmount < voucher.coupon_min_spend) {
      return {
        valid: false,
        message: `Giá trị đơn hàng tối thiểu phải từ ${voucher.coupon_min_spend.toLocaleString()}đ`,
      };
    }

    // Kiểm tra số lần sử dụng còn lại
    const usageCount = await knex("Order")
      .where({ coupon_id: voucher.id })
      .count("* as count")
      .first();

    if (usageCount.count >= voucher.coupon_uses_per_coupon) {
      return {
        valid: false,
        message: "Mã giảm giá đã hết lượt sử dụng",
      };
    }

    // Tính toán giá trị giảm giá
    let discountAmount = 0;
    if (voucher.coupon_type === "percent") {
      discountAmount = (totalAmount * voucher.coupon_value) / 100;
      if (voucher.coupon_max_spend > 0) {
        discountAmount = Math.min(discountAmount, voucher.coupon_max_spend);
      }
    } else {
      discountAmount = voucher.coupon_value;
    }

    return {
      valid: true,
      voucher: {
        ...voucher,
        discountAmount,
      },
      message: "Áp dụng mã giảm giá thành công",
    };
  } catch (error) {
    console.error("Error checking voucher:", error);
    throw new Error("Lỗi khi kiểm tra mã giảm giá");
  }
};

module.exports = {
  createPromotion,
  updatePromotion,
  deletePromotion,
  getPromotionDashboardData,
  checkVoucher,
};
