const bcrypt = require('bcryptjs');
const db = require('../models/db');

exports.getRegister = (req, res) => {
  res.render('register');
};

// controllers/authController.js

exports.postRegister = async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  // ✅ 服务器端也检查密码是否一致
  if (password !== confirmPassword) {
    return res.send('Passwords do not match.');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.promise().query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

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
      req.session.user = { id: user.id, username: user.username };
      res.redirect('/');
    } else {
      res.send('Login failed');
    }
  } catch (err) {
    console.error('Login Error:', err);
    res.send('Login error');
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};
