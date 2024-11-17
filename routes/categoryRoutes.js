const CategoryController = require('../controllers/categoryController');

const express = require('express');

const router = express.Router();

router.get('/categories', CategoryController.getCategories);

module.exports = router;