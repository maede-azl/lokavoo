const express = require('express');
const router = express.Router();
const protect = require('../middlewares/auth.middleware');
const checkBusinessOwner = require('../middlewares/checkBusinessOwner');
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
} = require('../controllers/notification.controller');

// دریافت نوتیفیکیشن‌ها
router.get(
  '/business/:businessId',
  protect,
  checkBusinessOwner,
  getNotifications
);

// علامت‌گذاری یک نوتیفیکیشن
router.put('/:id/read', protect, markNotificationRead);

// علامت‌گذاری همه
router.put('/business/:businessId/read-all', protect, checkBusinessOwner, markAllNotificationsRead);

// ساخت تست
router.post(
  '/business/:businessId/test',
  protect,
  checkBusinessOwner,
  createNotification
);

module.exports = router;