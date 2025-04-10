const db = require('../models/db');
const logger = require('../utils/logger');

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
    if (title === 'DB_ERROR') {
      throw new Error('Simulated database error');
    }

    await db.promise().query(
      'INSERT INTO posts (title, content, user_id) VALUES (?, ?, ?)',
      [title, content, userId]
    );

    await logger.logAction({
      userId,
      action: 'post_create',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.redirect('/');
  } catch (err) {
    console.error('Post Create Error:', err.message);
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
    if (content === 'DB_ERROR_COMMENT') {
      throw new Error('Simulated DB failure');
    }

    await db.promise().query(
      'INSERT INTO comments (content, post_id, user_id) VALUES (?, ?, ?)',
      [content, postId, userId]
    );

    await logger.logAction({
      userId,
      action: `comment_create_post_${postId}`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.redirect(`/post/${postId}`);
  } catch (err) {
    console.error('Comment Error:', err.message);
    res.send('Failed to add comment');
  }
};

exports.getEditPost = async (req, res) => {
  const postId = req.params.id;
  const userId = req.session.user.id;

  const [[post]] = await db.promise().query(
    'SELECT * FROM posts WHERE id = ? AND user_id = ?',
    [postId, userId]
  );

  if (!post) return res.status(403).send('Not authorized or post not found.');

  res.render('edit-post', { post, csrfToken: req.csrfToken() });
};

exports.postEditPost = async (req, res) => {
  const postId = req.params.id;
  const userId = req.session.user.id;
  const { title, content } = req.body;
  try {
    if (title === 'DB_ERROR_EDIT') {
      throw new Error('Simulated DB failure');
    }
    await db.promise().query(
      'UPDATE posts SET title = ?, content = ? WHERE id = ? AND user_id = ?',
      [title, content, postId, userId]
    );

    await logger.logAction({
      userId,
      action: `post_edit_${postId}`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.redirect(`/post/${postId}`);
  } catch (err) {
    console.error('Edit Error:', err.message);
    res.send('Failed to edit post');
  }
};

exports.deletePost = async (req, res) => {
  const postId = req.params.id;
  const userId = req.session.user.id;

  try {
    const [rows] = await db.promise().query(
      'SELECT title FROM posts WHERE id = ? AND user_id = ?',
      [postId, userId]
    );

    const post = rows[0];
    if (!post) {
      return res.status(404).send('Post not found');
    }

    if (post.title === 'DB_ERROR_DELETE') {
      throw new Error('Simulated DB failure');
    }

    await db.promise().query(
      'DELETE FROM posts WHERE id = ? AND user_id = ?',
      [postId, userId]
    );

    await logger.logAction({
      userId,
      action: `post_delete_${postId}`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.redirect('/');
  } catch (err) {
    console.error('DELETE Error:', err.message);
    res.send('Failed to delete post');
  }
};

