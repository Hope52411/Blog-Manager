const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');

// 博客主页
router.get('/', blogController.getAllPosts);

// 发布文章页面
router.get('/post/new', blogController.getNewPost);
router.post('/post/new', blogController.postNewPost);

// 查看单篇文章
router.get('/post/:id', blogController.getSinglePost);

// 评论文章
router.post('/post/:id/comment', blogController.postComment);

module.exports = router;
