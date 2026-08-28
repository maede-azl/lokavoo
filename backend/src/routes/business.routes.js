const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const checkBusinessOwner = require('../middlewares/checkBusinessOwner');
const {
  createBusiness,
  getBusinesses,
  getBusinessById,
  createReview,
  getBusinessesByCategory,
  trackAction,
  getDashboardStats,
  updateBusiness,
  getBusinessSettings,
  getDashboardReports,
  searchBusinesses,
} = require('../controllers/business.controller');
const protect = require('../middlewares/auth.middleware');
const prisma = require('../config/db');
const productController = require('../controllers/product.controller');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'businesses');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('فقط فایل تصویری مجاز است'), false);
  },
});

// ==================== ROUTES ====================
router.get('/mine', protect, async (req, res) => {
  try {
    const businesses = await prisma.business.findMany({
      where: { user_id: req.user.id },
      select: { id: true, name: true, status: true, category: { select: { name: true } } },
    });
    res.json({ success: true, count: businesses.length, data: businesses });
  } catch (error) {
    console.error('GET MY BUSINESSES ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// آمار داشبورد
router.get('/:businessId/stats', protect, checkBusinessOwner, getDashboardStats);
router.get('/:businessId/reports', protect, checkBusinessOwner, getDashboardReports);

// تنظیمات فروشگاه
router.get('/:businessId/settings', protect, checkBusinessOwner, getBusinessSettings);
router.put('/:businessId/settings', protect, checkBusinessOwner, updateBusiness);

// محصولات
router.get('/:businessId/products', protect, checkBusinessOwner, productController.getProducts);
router.post('/:businessId/products', protect, checkBusinessOwner, upload.single('image'), productController.createProduct);
router.put('/products/:productId', protect, upload.single('image'), productController.updateProduct);
router.delete('/products/:productId', protect, productController.deleteProduct);

// سرچ (باید قبل از /:id باشه)
router.get('/search', searchBusinesses);

// بقیه روت‌ها
router.get('/category/:key', getBusinessesByCategory);
router.get('/', getBusinesses);
router.get('/:id', getBusinessById);
router.post('/', protect, upload.array('images', 10), createBusiness);
router.post('/:id/reviews', protect, createReview);
router.post('/:id/track', trackAction);

module.exports = router;