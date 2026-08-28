const express = require('express');
const router = express.Router();
const {
  getReviewsByBusiness,
  createReview,
  replyToReview,
} = require('../controllers/review.controller');
const protect = require('../middlewares/auth.middleware');

// دریافت نظرات یک کسب‌وکار (عمومی)
router.get('/business/:businessId', getReviewsByBusiness);

// ثبت نظر جدید برای یک کسب‌وکار (نیاز به لاگین)
router.post('/business/:businessId', protect, createReview);

// پاسخ فروشنده به نظر (نیاز به لاگین + مالک کسب‌وکار)
router.post('/:reviewId/reply', protect, replyToReview);

module.exports = router;