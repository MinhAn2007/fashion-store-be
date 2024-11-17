const categoryService = require("../services/categoryService");
const getCategories = async (req, res) => {
  try {
    const categories = await categoryService.getListCategory();
    res.status(200).json({
      success: true,
      categories: categories,
    });
  } catch (error) {
    console.error("Error fetching all categories:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getCategoriesDashboard = async (req, res) => {
  try {
    const categories = await categoryService.getCategoriesDashboard();
    res.status(200).json({
      success: true,
      categories: categories,
    });
  } catch (error) {
    console.error("Error fetching all categories:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getCategories,
  getCategoriesDashboard,
};
