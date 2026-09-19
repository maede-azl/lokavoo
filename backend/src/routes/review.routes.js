const express = require('express');
const router = express.Router();
const {
  getReviewsByBusiness,
  createReview,
  replyToReview,
  getMyReviews,      // ← جدید
  updateReview,      // ← جدید
  deleteReview,      // ← جدید
} = require('../controllers/review.controller');
const protect = require('../middlewares/auth.middleware');

// نظرات یک کسب‌وکار (عمومی)
router.get('/business/:businessId', getReviewsByBusiness);

// ثبت نظر جدید
router.post('/business/:businessId', protect, createReview);

// پاسخ فروشنده
router.post('/:reviewId/reply', protect, replyToReview);

// ===== جدید: نظرات خود کاربر =====
router.get('/mine', protect, getMyReviews);
router.put('/:reviewId', protect, updateReview);
router.delete('/:reviewId', protect, deleteReview);

module.exports = router;