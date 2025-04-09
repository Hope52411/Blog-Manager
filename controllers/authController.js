const bcrypt = require('bcryptjs');
const db = require('../models/db');
const logger = require('../utils/logger');

exports.getRegister = (req, res) => {
  res.render('register');
};

exports.postRegister = async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.send('Passwords do not match.');
  }

  try {
    const [rows] = await db.promise().query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (rows.length > 0) {
      return res.send('Username already exists. Please choose another one.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.promise().query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

    await logger.logAction({
      userId: null,
      action: 'register_success',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.redirect('/login');
  } catch (err) {
    console.error('Register Error:', err);
    res.send('Registration failed.');
  }
};


exports.getLogin = (req, res) => {
  res.render('login');
};

exports.postLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    const user = rows[0];

    if (!user) {
      await logger.logAction({
        userId: null,
        action: `login_failed_user_not_found_${username}`,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      return res.send('Login failed.');
    }

    // Check whether the account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.send(`Account locked. Try again after ${user.locked_until}`);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      // Login successful: reset attempts
      await db.promise().query(
        'UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?',
        [user.id]
      );

      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role
      };

      await logger.logAction({
        userId: user.id,
        action: 'login_success',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return (user.role === 'admin')
        ? res.redirect('/admin/dashboard')
        : res.redirect('/');
    } else {
      // Login failed: number of update attempts
      const attempts = user.login_attempts + 1;

      if (attempts >= 5) {
        // Lock the account for 10 minutes after 5 failures
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

exports.logout = (req, res) => {
  const userId = req.session?.user?.id || null;

  logger.logAction({
    userId,
    action: 'logout',
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  req.session.destroy(() => {
    res.redirect('/login');
  });
};
