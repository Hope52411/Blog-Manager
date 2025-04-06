const db = require('../models/db');

exports.getDashboard = async (req, res) => {
    try {
      const [posts] = await db.promise().query(`
        SELECT posts.id, posts.title, users.username
        FROM posts
        JOIN users ON posts.user_id = users.id
      `);
  
      const [comments] = await db.promise().query(`
        SELECT comments.id, comments.content, users.username, comments.post_id
        FROM comments
        JOIN users ON comments.user_id = users.id
      `);
  
      let csrfToken;
      try {
        csrfToken = req.csrfToken();
      } catch (e) {
        csrfToken = null;
      }
  
      res.render('admin-dashboard', {
        posts,
        comments,
        user: req.session.user,
        csrfToken
      });
  
    } catch (err) {
      console.error('Admin Dashboard Error:', err);
      res.status(500).send('Internal server error');
    }
  };
  

exports.deletePost = async (req, res) => {
  const postId = req.params.id;
  try {
    await db.promise().query('DELETE FROM posts WHERE id = ?', [postId]);
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Delete Post Error:', err);
    res.status(500).send('Failed to delete post');
  }
};

exports.deleteComment = async (req, res) => {
  const commentId = req.params.id;
  try {
    await db.promise().query('DELETE FROM comments WHERE id = ?', [commentId]);
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Delete Comment Error:', err);
    res.status(500).send('Failed to delete comment');
  }
};
