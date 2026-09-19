//subscription.routes
const express = require('express');
const router = express.Router();

const protect = require('../middlewares/auth.middleware');
const checkBusinessOwner = require('../middlewares/checkBusinessOwner');
const subscription = require('../controllers/subscription.controller');

// لیست پلن‌ها (عمومی)
router.get('/plans', subscription.getPlans);

// اشتراک فعلی یک کسب‌وکار
router.get('/my/:businessId', protect, checkBusinessOwner, subscription.getMySubscription);

// خرید/فعال‌سازی اشتراک
router.post('/:businessId/subscribe', protect, checkBusinessOwner, subscription.subscribe);

module.exports = router;
