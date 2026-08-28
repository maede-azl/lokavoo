const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, completeSignup } = require('../controllers/auth.controller');
const protect = require('../middlewares/auth.middleware');
const prisma = require('../config/db');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/complete-signup', completeSignup);

// اطلاعات کاربر لاگین‌شده
router.get('/me', protect, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'کاربر پیدا نشد' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('GET /auth/me ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

module.exports = router;