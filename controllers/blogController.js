const db = require('../models/db');

exports.getAllPosts = async (req, res) => {
  try {
    const [posts] = await db.promise().query(
      'SELECT posts.*, users.username FROM posts JOIN users ON posts.user_id = users.id ORDER BY posts.id DESC'
    );
    res.render('index', { posts });
  } catch (err) {
    console.error('Get Posts Error:', err);
    res.send('Failed to load posts');
  }
};

exports.getNewPost = (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('new-post');
};

exports.postNewPost = async (req, res) => {
  const { title, content } = req.body;
  const userId = req.session.user.id;

  try {
    await db.promise().query(
      'INSERT INTO posts (title, content, user_id) VALUES (?, ?, ?)',
      [title, content, userId]
    );
    res.redirect('/');
  } catch (err) {
    console.error('Post Create Error:', err);
    res.send('Failed to create post');
  }
};

exports.getSinglePost = async (req, res) => {
  const postId = req.params.id;
  try {
    const [[post]] = await db.promise().query(
      'SELECT posts.*, users.username FROM posts JOIN users ON posts.user_id = users.id WHERE posts.id = ?',
      [postId]
    );
    const [comments] = await db.promise().query(
      'SELECT comments.*, users.username FROM comments JOIN users ON comments.user_id = users.id WHERE post_id = ?',
      [postId]
    );
    res.render('post', { post, comments });
  } catch (err) {
    console.error('Get Single Post Error:', err);
    res.send('Failed to load post');
  }
};

exports.postComment = async (req, res) => {
  const { content } = req.body;
  const userId = req.session.user.id;
  const postId = req.params.id;

  try {
    await db.promise().query(
      'INSERT INTO comments (content, post_id, user_id) VALUES (?, ?, ?)',
      [content, postId, userId]
    );
    res.redirect(`/post/${postId}`);
  } catch (err) {
    console.error('Comment Error:', err);
    res.send('Failed to add comment');
  }
};
