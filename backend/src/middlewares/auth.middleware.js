const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'لطفا ابتدا وارد شوید',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
        province: true,   
        city: true,
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

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'توکن نامعتبر یا منقضی شده',
    });
  }
};

module.exports = protect;