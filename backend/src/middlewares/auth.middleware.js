const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'لطفا ابتدا وارد شوید',
      });
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'توکن ارسال نشده است',
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'خطای پیکربندی سرور',
      });
    }

    const decoded = jwt.verify(token, secret);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'توکن نامعتبر است',
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },

      select: {
        id: true,
        phone: true,
        name: true,
        username: true,
        email: true,
        bio: true,
        avatar: true,
        birthdate: true,
        role: true,
        status: true,
        province: true,
        city: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        lastLoginDevice: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'کاربر یافت نشد',
      });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'حساب کاربری شما مسدود شده است',
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error('AUTH MIDDLEWARE ERROR:', error);

    return res.status(401).json({
      success: false,
      message: 'توکن نامعتبر یا منقضی شده',
    });
  }
};

module.exports = protect;