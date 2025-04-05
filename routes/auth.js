const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register Page
router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);

// Login Page
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

// Logout
router.get('/logout', authController.logout);

module.exports = router;
