//profile.controller
const prisma = require('../config/db');
const path = require('path');
const fs = require('fs');
const { logActivity } = require('./activity.controller');
 
console.log('=== profile.controller.js LOADED SUCCESSFULLY ===');
 
// گرفتن پروفایل کاربر لاگین‌شده + آمار واقعی
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
 
    const [businessesCount, reviewsCount, favoritesCount, recentViewsCount] =
      await Promise.all([
        prisma.business.count({ where: { user_id: userId } }),
        prisma.review.count({ where: { user_id: userId } }),
        prisma.bookmark.count({ where: { user_id: userId } }),
        prisma.viewHistory.count({
          where: {
            user_id: userId,
            viewed_at: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // ۳۰ روز اخیر
            },
          },
        }),
      ]);
 
    res.json({
      success: true,
      data: {
        ...req.user,
        stats: {
          businesses: businessesCount,
          reviews: reviewsCount,
          favorites: favoritesCount,
          recentViews: recentViewsCount,
        },
      },
    });
  } catch (error) {
    console.error('GET PROFILE ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};
 
// آپدیت اطلاعات پروفایل
exports.updateMyProfile = async (req, res) => {
  try {
    const { name, username, email, bio, birthdate, province, city } = req.body;
 
    if (username && username !== req.user.username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username },
      });
      if (existingUsername) {
        return res.status(409).json({
          success: false,
          message: 'این نام کاربری قبلاً استفاده شده است',
        });
      }
    }
 
    if (email && email !== req.user.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'این ایمیل قبلاً توسط حساب دیگری استفاده شده است',
        });
      }
    }
 
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name !== undefined ? name : undefined,
        username: username !== undefined ? username : undefined,
        email: email !== undefined ? email : undefined,
        bio: bio !== undefined ? bio : undefined,
        birthdate: birthdate !== undefined ? birthdate : undefined,
        province: province !== undefined ? province : undefined,
        city: city !== undefined ? city : undefined,
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
        province: true,
        city: true,
      },
    });
 
    await logActivity({
      userId: req.user.id,
      type: 'profile_update',
      message: 'اطلاعات پروفایل خود را به‌روزرسانی کردید',
    });
 
    res.json({
      success: true,
      message: 'پروفایل با موفقیت به‌روزرسانی شد',
      data: updatedUser,
    });
  } catch (error) {
    console.error('UPDATE PROFILE ERROR:', error);
 
    // خطای یکتایی Prisma (برای اطمینان، حتی اگه چک بالا رو رد کرده باشه)
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'اطلاعات';
      return res.status(409).json({
        success: false,
        message: `این ${field === 'email' ? 'ایمیل' : field === 'username' ? 'نام کاربری' : field} قبلاً استفاده شده است`,
      });
    }
 
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};
 
// آپلود عکس پروفایل
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'فایلی ارسال نشده است',
      });
    }
 
    if (req.user.avatar) {
      const oldPath = path.join(__dirname, '../../', req.user.avatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
 
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
 
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: avatarUrl },
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
      },
    });
 
    res.json({
      success: true,
      message: 'عکس پروفایل با موفقیت به‌روزرسانی شد',
      data: updatedUser,
    });
  } catch (error) {
    console.error('UPLOAD AVATAR ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};
 
// حذف عکس پروفایل
exports.removeAvatar = async (req, res) => {
  try {
    if (req.user.avatar) {
      const oldPath = path.join(__dirname, '../../', req.user.avatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
 
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: null },
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
      },
    });
 
    res.json({
      success: true,
      message: 'عکس پروفایل حذف شد',
      data: updatedUser,
    });
  } catch (error) {
    console.error('REMOVE AVATAR ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};
 
// حذف کامل حساب کاربری
exports.deleteMyAccount = async (req, res) => {
  try {
    const userId = req.user.id;
 
    if (req.user.avatar) {
      const oldPath = path.join(__dirname, '../../', req.user.avatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
 
    await prisma.review.deleteMany({ where: { user_id: userId } });
    await prisma.bookmark.deleteMany({ where: { user_id: userId } });
    await prisma.viewHistory.deleteMany({ where: { user_id: userId } });
 
    await prisma.user.delete({ where: { id: userId } });
 
    res.json({
      success: true,
      message: 'حساب کاربری با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('DELETE ACCOUNT ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در حذف حساب کاربری',
    });
  }
};
 
// ثبت گزارش مشکل
exports.submitProblemReport = async (req, res) => {
  try {
    const { subject, description } = req.body;
 
    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'موضوع و توضیحات الزامی است',
      });
    }
 
    const report = await prisma.problemReport.create({
      data: {
        user_id: req.user.id,
        subject: subject.trim(),
        description: description.trim(),
      },
    });
 
    res.json({
      success: true,
      message: 'گزارش شما با موفقیت ثبت شد',
      data: report,
    });
  } catch (error) {
    console.error('SUBMIT PROBLEM REPORT ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ثبت گزارش',
    });
  }
};
 
// تشخیص استان/شهر از روی مختصات جغرافیایی (Reverse Geocoding)
exports.reverseGeocode = async (req, res) => {
  try {
    const { lat, lng } = req.query;
 
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'مختصات جغرافیایی ارسال نشده است',
      });
    }
 
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&accept-language=fa&zoom=10`;
 
    const response = await fetch(url, {
      headers: {
        // Nominatim برای استفاده رایگان نیاز به User-Agent معتبر داره
        'User-Agent': 'Lokavo-App/1.0 (support@lokavo.ir)',
      },
    });
 
    if (!response.ok) {
      throw new Error(`Nominatim responded with ${response.status}`);
    }
 
    const geoData = await response.json();
    const addr = geoData.address || {};
 
    // پاکسازی «استان» از ابتدای نام استان
    const rawProvince = addr.state || addr.province || '';
    const province = rawProvince.replace(/^استان\s*/, '').trim();
 
    const city =
      addr.city || addr.town || addr.village || addr.county || '';
 
    if (!province && !city) {
      return res.json({
        success: true,
        data: { province: null, city: null },
      });
    }
 
    res.json({
      success: true,
      data: { province, city },
    });
  } catch (error) {
    console.error('REVERSE GEOCODE ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در تشخیص موقعیت مکانی',
    });
  }
};
