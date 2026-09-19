//settings.routes.js
const express = require('express');
const router = express.Router();

const settings = require('../controllers/settings.controller');

// عمومی — بدون نیاز به لاگین
router.get('/public', settings.getPublicSettings);
router.get('/footer', settings.getPublicFooter);

module.exports = router;
