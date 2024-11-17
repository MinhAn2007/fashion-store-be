const CategoryController = require('../controllers/categoryController');

const express = require('express');

const router = express.Router();

router.get('/categories', CategoryController.getCategories);

router.get('/categories/dashboard', CategoryController.getCategoriesDashboard);

module.exports = router;