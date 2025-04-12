const db = require('../models/db'); // Database connection
const logger = require('../utils/logger'); // Logger for actions

// Show the admin dashboard
exports.getDashboard = async (req, res) => {
  try {
    // Get all posts with usernames
    const [posts] = await db.promise().query(`
      SELECT posts.id, posts.title, users.username
      FROM posts
      JOIN users ON posts.user_id = users.id
    `);

    // Get all comments with usernames and post IDs
    const [comments] = await db.promise().query(`
      SELECT comments.id, comments.content, users.username, comments.post_id
      FROM comments
      JOIN users ON comments.user_id = users.id
    `);

    // Try to get CSRF token
    let csrfToken;
    try {
      csrfToken = req.csrfToken();
    } catch (e) {
      csrfToken = null;
    }

    // Render the dashboard page
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

// Delete a post
exports.deletePost = async (req, res) => {
  const postId = req.params.id;
  const userId = req.session?.user?.id;

  try {
    // Delete the post from database
    await db.promise().query('DELETE FROM posts WHERE id = ?', [postId]);

    // Log the delete action
    await logger.logAction({
      userId,
      action: `admin_delete_post_${postId}`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Go back to dashboard
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Delete Post Error:', err);
    res.status(500).send('Failed to delete post');
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  const commentId = req.params.id;
  const userId = req.session?.user?.id;

  try {
    // Delete the comment from database
    await db.promise().query('DELETE FROM comments WHERE id = ?', [commentId]);

    // Log the delete action
    await logger.logAction({
      userId,
      action: `admin_delete_comment_${commentId}`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Go back to dashboard
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Delete Comment Error:', err);
    res.status(500).send('Failed to delete comment');
  }
};
