//support.routes.js
const express = require('express');
const router = express.Router();

const protect = require('../middlewares/auth.middleware');
const support = require('../controllers/support.controller');

router.get('/thread', protect, support.getMyThread);
router.post('/thread/messages', protect, support.sendMyMessage);

module.exports = router;
