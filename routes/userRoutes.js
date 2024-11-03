const express = require('express');
const router = express.Router();
const userController = require('../controllers/userControllers');
const verifyToken = require('../middlewares/authMiddleware');

router.post('/login', userController.login);

router.post('/signup', userController.signUp);

router.get('/users/:id', verifyToken, userController.getUserInfo);

router.put('/users/me', verifyToken, userController.updateUserInfo);

module.exports = router;