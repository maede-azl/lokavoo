//profile.routes
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const protect = require('../middlewares/auth.middleware');
const profileController = require('../controllers/profile.controller');

// ساخت پوشه آواتار
const avatarDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `avatar-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('فقط فایل تصویری مجاز است'), false);
    }
  },
});

// روت‌ها
router.get('/me', protect, profileController.getMyProfile);
router.put('/me', protect, profileController.updateMyProfile);
router.post('/avatar', protect, upload.single('avatar'), profileController.uploadAvatar);
router.delete('/avatar', protect, profileController.removeAvatar);
router.post('/report', protect, profileController.submitProblemReport);
router.get('/reverse-geocode', protect, profileController.reverseGeocode);

// ← این خط حتماً باید وجود داشته باشد
router.delete('/me', protect, profileController.deleteMyAccount);

module.exports = router;