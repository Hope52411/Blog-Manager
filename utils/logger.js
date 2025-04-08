// utils/logger.js
const db = require('../models/db');

exports.logAction = async ({ userId, action, ip, userAgent }) => {
  try {
    await db.promise().query(
      'INSERT INTO logs (user_id, action, ip_address, user_agent) VALUES (?, ?, ?, ?)',
      [userId, action, ip, userAgent]
    );
  } catch (err) {
    console.error('Logging failed:', err);
  }
};
