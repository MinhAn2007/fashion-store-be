const express = require('express');
const { getAllUsersHandler } = require('../controllers/userController');

const router = express.Router();

// Route để lấy tất cả người dùng
router.get('/users', getAllUsersHandler);

module.exports = router;
