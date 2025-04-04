const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 注册页面
router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);

// 登录页面
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

// 登出
router.get('/logout', authController.logout);

module.exports = router;
