const db = require('./db');

exports.createUser = (username, hashedPassword) => {
  return db.promise().query(
    'INSERT INTO users (username, password) VALUES (?, ?)',
    [username, hashedPassword]
  );
};

exports.findByUsername = (username) => {
  return db.promise().query(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );
};
