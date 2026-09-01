const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// لیست پلن‌ها (عمومی)
router.get('/plans', subscriptionController.getPlans);

// اشتراک فعلی یک کسب‌وکار (نیاز به لاگین)
router.get('/my/:businessId', authMiddleware, subscriptionController.getMySubscription);

// خرید / فعال‌سازی اشتراک (نیاز به لاگین)
router.post('/subscribe', authMiddleware, subscriptionController.subscribe);

module.exports = router;