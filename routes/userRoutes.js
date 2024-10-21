const express = require('express');
const router = express.Router();
const userController = require('../controllers/userControllers');

router.post('/login', userController.login);

router.post('/signup', userController.signUp);

module.exports = router;