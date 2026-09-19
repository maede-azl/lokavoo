const express = require('express');
const router = express.Router();

const multer = require('multer');
const { createStorage, imageFileFilter } = require('../services/storage');

const checkBusinessOwner = require('../middlewares/checkBusinessOwner');
const protect = require('../middlewares/auth.middleware');

const {
  createBusiness,
  getBusinesses,
  getBusinessById,
  createReview,
  getBusinessesByCategory,
  trackAction,
  getDashboardStats,
  getDashboardReports,
  getBusinessSettings,
  searchBusinesses,
  getMyBusinesses,
  updateBusinessSettings,
  updateBusiness,
  deleteBusiness,
  getPromoTypes,
  getMyPromos,
  requestPromo,
} = require('../controllers/business.controller');

const productController = require('../controllers/product.controller');

// آپلود تصاویر کسب‌وکار — روی دیسک سرور یا S3 (بسته به STORAGE_DRIVER در .env)
const storage = createStorage('businesses');

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: imageFileFilter,
});

// کسب‌وکارهای کاربر فعلی
router.get('/mine', protect, getMyBusinesses);

// سرچ
router.get('/search', searchBusinesses);

// کسب‌وکارهای یک دسته‌بندی
router.get('/category/:key', getBusinessesByCategory);

// Dashboard
router.get(
  '/:businessId/stats',
  protect,
  checkBusinessOwner,
  getDashboardStats
);

// گزارشات رشد/بازدید داشبورد فروشنده
router.get(
  '/:businessId/reports',
  protect,
  checkBusinessOwner,
  getDashboardReports
);

// Settings
router.get(
  '/:businessId/settings',
  protect,
  checkBusinessOwner,
  getBusinessSettings
);

router.put(
  '/:businessId/settings',
  protect,
  checkBusinessOwner,
  updateBusinessSettings
);

// ویرایش کامل کسب‌وکار با تصویر
router.put(
  '/:businessId',
  protect,
  checkBusinessOwner,
  upload.array('images', 10),
  updateBusiness
);

// حذف کسب‌وکار
router.delete(
  '/:businessId',
  protect,
  checkBusinessOwner,
  deleteBusiness
);

// Products
router.get(
  '/:businessId/products',
  protect,
  checkBusinessOwner,
  productController.getProducts
);

router.post(
  '/:businessId/products',
  protect,
  checkBusinessOwner,
  upload.single('image'),
  productController.createProduct
);

// مهم: برای جلوگیری از ویرایش محصول متعلق به فروشنده دیگر، checkBusinessOwner
// در خود controller محصول باید مالکیت product.business_id را هم بررسی کند.
router.put(
  '/products/:productId',
  protect,
  upload.single('image'),
  productController.updateProduct
);

router.delete(
  '/products/:productId',
  protect,
  productController.deleteProduct
);

// عمومی
router.get('/', getBusinesses);

// تبلیغات و پروموشن (سمت فروشنده) — باید قبل از /:id باشه وگرنه
// "promo-types" به‌عنوان یک businessId اشتباه تفسیر می‌شه
router.get('/promo-types', getPromoTypes);
router.get('/:businessId/promos', protect, checkBusinessOwner, getMyPromos);
router.post('/:businessId/promos', protect, checkBusinessOwner, requestPromo);

router.get('/:id', getBusinessById);

// ثبت کسب‌وکار
router.post(
  '/',
  protect,
  upload.array('images', 10),
  createBusiness
);

// ثبت نظر
router.post('/:id/reviews', protect, createReview);

// تماس / مسیریابی
router.post('/:id/track', trackAction);

module.exports = router;
