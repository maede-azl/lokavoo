//admin.routes.js
const express = require('express');
const router = express.Router();

const protect = require('../middlewares/auth.middleware');
const isAdmin = require('../middlewares/isAdmin');
const admin = require('../controllers/admin.controller');

// همه‌ی روت‌های این فایل نیاز به لاگین + نقش ادمین دارند
router.use(protect, isAdmin);

// آمار کلی
router.get('/stats', admin.getStats);

// کاربران
router.get('/users', admin.getUsers);
router.put('/users/:userId/status', admin.updateUserStatus);
router.put('/users/:userId/role', admin.updateUserRole);
router.delete('/users/:userId', admin.deleteUser);

// کسب‌وکارها (فروشندگان)
router.get('/businesses', admin.getBusinesses);
router.put('/businesses/:businessId/status', admin.updateBusinessStatus);
router.put('/businesses/:businessId/banner', admin.toggleBusinessBanner);
router.delete('/businesses/:businessId', admin.deleteBusinessAdmin);

// دسته‌بندی‌ها
router.post('/categories', admin.createCategory);
router.put('/categories/:categoryId', admin.updateCategory);
router.delete('/categories/:categoryId', admin.deleteCategory);

// محصولات
router.get('/products', admin.getProducts);
router.put('/products/:productId/active', admin.updateProductActive);
router.delete('/products/:productId', admin.deleteProductAdmin);

// پروموشن‌ها / تبلیغات
router.get('/promos', admin.getPromos);
router.put('/promos/:promoId/status', admin.updatePromoStatus);
router.put('/promos/:promoId/visible', admin.togglePromoVisible);

// پیام‌های پشتیبانی
router.post('/threads/start', admin.startOrGetThread);
router.get('/threads', admin.getThreads);
router.put('/threads/:threadId/read', admin.markThreadRead);
router.post('/threads/:threadId/messages', admin.sendAdminMessage);

// گزارش‌های مشکل کاربران
router.get('/reports', admin.getReports);
router.put('/reports/:reportId', admin.replyToReport);

// آمار کلیک‌ها
router.get('/clicks', admin.getClicksOverview);

// کسب‌ودرآمد سایت
router.get('/revenue', admin.getRevenue);

// تنظیمات سایت
router.get('/settings', admin.getSettings);
router.put('/settings', admin.updateSettings);

// فوتر
router.get('/footer', admin.getFooter);
router.put('/footer', admin.updateFooter);

module.exports = router;
