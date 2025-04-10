// utils/logger.js
const db = require('../models/db');

exports.logAction = async ({ userId, action, ip, userAgent }) => {
  try {
    // Used to test abnormal processes
    if (action === 'SIMULATE_LOG_FAIL') {
      throw new Error('Simulated logging failure');
    }

    await db.promise().query(
      'INSERT INTO logs (user_id, action, ip_address, user_agent) VALUES (?, ?, ?, ?)',
      [userId, action, ip, userAgent]
    );
  } catch (err) {
    console.error('Logging failed:', err.message);
  }
};

