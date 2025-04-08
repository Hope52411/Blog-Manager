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
    res.send('Registration failed');
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

    if (user && await bcrypt.compare(password, user.password)) {
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

      if (user.username === 'admin' || user.role === 'admin') {
        return res.redirect('/admin/dashboard');
      }

      return res.redirect('/');
    } else {

      await logger.logAction({
        userId: null,
        action: `login_failed_${username}`,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      return res.send('Login failed');
    }
  } catch (err) {
    console.error('Login Error:', err);
    res.send('Login error');
  }
};

exports.logout = (req, res) => {
  const userId = req.session?.user?.id || null;

  // ✅ 登出日志
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
