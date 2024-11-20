const express = require('express');
const router = express.Router();
const userController = require('../controllers/userControllers');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

router.get('/users', verifyAdmin, userController.getAllUsers);

router.get('/users/stats', verifyAdmin, userController.getUserStats);

router.get('/users/stats', userController.getUserStats);

router.post('/login', userController.login);

router.post('/signup', userController.signUp);

router.get('/users/:id', verifyToken, userController.getUserInfo);

router.put('/users/me', verifyToken, userController.updateUserInfo);

router.delete('/users/me/addresses/:addressId', verifyToken, userController.deleteAddressController);

//admin login
router.post('/admin/login', userController.adminLogin);


module.exports = router;