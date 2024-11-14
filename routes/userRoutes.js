const express = require('express');
const router = express.Router();
const userController = require('../controllers/userControllers');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/users/stats', userController.getUserStats);

router.post('/login', userController.login);

router.post('/signup', userController.signUp);

router.get('/users/:id', verifyToken, userController.getUserInfo);

router.put('/users/me', verifyToken, userController.updateUserInfo);

router.delete('/users/me/addresses/:addressId', verifyToken, userController.deleteAddressController);

//Admin
// Lấy danh sách khách hàng với phân trang, tìm kiếm, sắp xếp
// router.get('/users', verifyToken, userController.getAllUsers);
router.get('/users', userController.getAllUsers);
// router.get('/users', verifyAdmin, userController.getAllUsers);

// Lấy thống kê khách hàng



//admin login
router.post('/admin/login', userController.adminLogin);


module.exports = router;