const bcrypt = require('bcryptjs'); // For hashing and comparing passwords
const db = require('../models/db'); // Database connection
const logger = require('../utils/logger'); // Logger for user actions

// Show registration page
exports.getRegister = (req, res) => {
  res.render('register');
};

// Handle registration form submission
exports.postRegister = async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  // Check if passwords match
  if (password !== confirmPassword) {
    return res.send('Passwords do not match.');
  }

  try {
    // Check if username already exists
    const [rows] = await db.promise().query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (rows.length > 0) {
      return res.send('Username already exists. Please choose another one.');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into database
    await db.promise().query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

    // Log the registration action
    await logger.logAction({
      userId: null,
      action: 'register_success',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Redirect to login page after successful registration
    res.redirect('/login');
  } catch (err) {
    console.error('Register Error:', err);
    res.send('Registration failed.');
  }
};

// Show login page
exports.getLogin = (req, res) => {
  res.render('login');
};

// Handle login form submission
exports.postLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username
    const [rows] = await db.promise().query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    const user = rows[0];

    // If user not found
    if (!user) {
      await logger.logAction({
        userId: null,
        action: `login_failed_user_not_found_${username}`,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      return res.send('Login failed.');
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.send(`Account locked. Try again after ${user.locked_until}`);
    }

    // Compare password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      // Login success: reset attempts and unlock account
      await db.promise().query(
        'UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?',
        [user.id]
      );

      // Store user in session
      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role
      };

      // Log successful login
      await logger.logAction({
        userId: user.id,
        action: 'login_success',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Redirect based on role
      return (user.role === 'admin')
        ? res.redirect('/admin/dashboard')
        : res.redirect('/');
    } else {
      // Login failed: increase attempt count
      const attempts = user.login_attempts + 1;

      if (attempts >= 5) {
        // Lock account for 10 minutes after 5 failed attempts
        await db.promise().query(
          'UPDATE users SET login_attempts = ?, locked_until = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id = ?',
          [attempts, user.id]
        );

        await logger.logAction({
          userId: user.id,
          action: `account_locked_after_5_failures`,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });

        return res.send('Too many failed attempts. Account locked for 10 minutes.');
      } else {
        // Update login attempts count
        await db.promise().query(
          'UPDATE users SET login_attempts = ? WHERE id = ?',
          [attempts, user.id]
        );

        await logger.logAction({
          userId: user.id,
          action: `login_failed_${attempts}_attempts`,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });

        return res.send(`Login failed. Attempt ${attempts}/5`);
      }
    }
  } catch (err) {
    console.error('Login Error:', err);
    res.send('Login error');
  }
};

// Handle logout
exports.logout = (req, res) => {
  const userId = req.session?.user?.id || null;

  // Log logout action
  logger.logAction({
    userId,
    action: 'logout',
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Destroy session and redirect to login
  req.session.destroy(() => {
    res.redirect('/login');
  });
};
