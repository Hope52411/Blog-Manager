const bcrypt = require('bcryptjs');
const db = require('../models/db');

exports.getRegister = (req, res) => {
  res.render('register');
};

// controllers/authController.js

exports.postRegister = async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.send('Passwords do not match.');
  }

  try {
    // const hashedPassword = await bcrypt.hash(password, 10);
    await db.promise().query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, password]
      // [username, hashedPassword]
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
    // Implement SQL injection
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    const [rows] = await db.promise().query(query);
    const user = rows[0];

    if (user) {
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
