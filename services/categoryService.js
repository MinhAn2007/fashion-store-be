const knex = require("../config/database").db;

const getListCategory = async () => {
  return await knex("Category").select("*");
};
const getCategoriesDashboard = async () => {
  try {
    // Lấy danh sách categories với thông tin tổng hợp
    const categories = await knex("Category as c")
      .leftJoin("Category as parent", "c.parent_id", "parent.id")
      .leftJoin("Product as p", "p.category_id", "c.id")
      .leftJoin("Products_skus as ps", "p.id", "ps.product_id")
      .leftJoin("OrderItem as oi", "ps.id", "oi.product_id")
      .leftJoin("Order as o", "oi.order_id", "o.id")
      .whereNull("c.deleted_at")
      .select([
        "c.id",
        "c.name",
        "c.description",
        "c.status",
        "c.created_at",
        "parent.name as parent_category_name",
        "parent.id as parent_category_id",
        knex.raw("COUNT(DISTINCT p.id) as total_products"),
        knex.raw(`
            COALESCE(SUM(
              CASE 
                WHEN o.status = 'Completed' 
                THEN oi.price * oi.quantity 
                ELSE 0 
              END
            ), 0) as revenue
          `),
      ])
      .groupBy(
        "c.id",
        "c.name",
        "c.description",
        "c.status",
        "c.created_at",
        "parent.name"
      );

    // Lấy thống kê tổng hợp cho dashboard
    const [stats] = await knex.raw(`
        SELECT
          COUNT(DISTINCT c.id) as total_categories,
          COUNT(DISTINCT CASE WHEN c.status = 1 THEN c.id END) as active_categories,
          COUNT(DISTINCT p.id) as total_products,
          COALESCE(SUM(
            CASE 
              WHEN o.status = 'Completed' 
              THEN oi.price * oi.quantity 
              ELSE 0 
            END
          ), 0) as total_revenue
        FROM Category c
        LEFT JOIN Product p ON p.category_id = c.id
        LEFT JOIN Products_skus ps ON p.id = ps.product_id
        LEFT JOIN OrderItem oi ON ps.id = oi.product_id
        LEFT JOIN \`Order\` o ON oi.order_id = o.id
        WHERE c.deleted_at IS NULL
      `);

    // Format lại data theo cấu trúc UI cần
    return {
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        parentCategory: category.parent_category_name || "—",
        parentCategoryId: category.parent_category_id || null,
        totalProducts: parseInt(category.total_products),
        status: category.status === 1 ? "active" : "inactive",
        revenue: parseFloat(category.revenue),
        created: new Date(category.created_at).toLocaleDateString(),
      })),
      stats: {
        totalCategories: stats[0].total_categories,
        activeCategories: stats[0].active_categories,
        totalProducts: stats[0].total_products,
        totalRevenue: parseFloat(stats[0].total_revenue),
      },
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

const addCategory = async (category) => {
  try {
    const [id] = await knex("Category").insert(category);
    return id;
  } catch (error) {
    console.error("Error adding category:", error);
    throw error;
  }
};

const editCategory = async (category,id) => {
  try {
    await knex("Category").where("id", id).update(category);
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
}

module.exports = {
  getListCategory,
  getCategoriesDashboard,
  addCategory,
  editCategory,
};
