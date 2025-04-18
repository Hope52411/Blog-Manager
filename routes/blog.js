const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');

// Blog homepage
router.get('/', blogController.getAllPosts);

// Publish article page
router.get('/post/new', blogController.getNewPost);
router.post('/post/new', blogController.postNewPost);

// View individual articles
router.get('/post/:id', blogController.getSinglePost);

// Review article
router.post('/post/:id/comment', blogController.postComment);

//Edit Blog
router.get('/post/edit/:id', blogController.getEditPost);
router.post('/post/edit/:id', blogController.postEditPost);

//Delete Blog
router.post('/post/delete/:id', blogController.deletePost);

module.exports = router;
