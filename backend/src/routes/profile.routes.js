//profile.routes
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createStorage, imageFileFilter } = require('../services/storage');
const protect = require('../middlewares/auth.middleware');
const profileController = require('../controllers/profile.controller');

// آپلود آواتار — روی دیسک سرور یا S3 (بسته به STORAGE_DRIVER در .env)
const storage = createStorage(
  'avatars',
  (req, file) => `avatar-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`
);

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
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