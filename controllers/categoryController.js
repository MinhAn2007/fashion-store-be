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

const addCategory = async (req, res) => {
  try {
    const category = req.body;
    const id = await categoryService.addCategory(category);
    res.status(200).json({
      success: true,
      id: id,
    });
  } catch (error) {
    console.error("Error adding category:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

const editCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const category = req.body;
    await categoryService.editCategory(category,id);
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("Error updating category:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

module.exports = {
  getCategories,
  getCategoriesDashboard,
  addCategory,
  editCategory,
};
