const express = require('express');
const router = express.Router();
const xssDemoController = require('../controllers/xssDemoController');

router.get('/search', xssDemoController.getSearch);

module.exports = router;
