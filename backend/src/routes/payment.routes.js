//payment.routes
const express = require('express');
const router = express.Router();

const protect = require('../middlewares/auth.middleware');
const checkBusinessOwner = require('../middlewares/checkBusinessOwner');
const payment = require('../controllers/payment.controller');

// شروع پرداخت خرید اشتراک
router.post('/subscribe/:businessId', protect, checkBusinessOwner, payment.initiateSubscriptionPayment);

// بازگشت از درگاه بانک ملت (این مسیر مستقیم توسط بانک صدا زده می‌شود)
router.post('/mellat/callback', payment.mellatCallback);
router.get('/mellat/callback', payment.mellatCallback);

module.exports = router;
