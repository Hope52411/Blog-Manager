const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/auth');

router.get('/dashboard', isAdmin, adminController.getDashboard);
router.post('/delete-post/:id', isAdmin, adminController.deletePost);
router.post('/delete-comment/:id', isAdmin, adminController.deleteComment);

module.exports = router;
