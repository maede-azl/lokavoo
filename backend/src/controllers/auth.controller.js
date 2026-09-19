const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { sendOtpSms } = require('../services/sms');

function generateOtp() {
  return Math.floor(
    10000 + Math.random() * 90000
  ).toString();
}

// ============================================
// JWT
// ============================================

function generateToken(userId) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    // به‌جای استفاده‌ی خاموش از یک رمز حدس‌زدنی، خطای واضح می‌دیم —
    // امن‌تره که سرور بالا نیاد تا اینکه با یک JWT قابل‌جعل کار کنه
    throw new Error('JWT_SECRET در متغیرهای محیطی تنظیم نشده است');
  }

  return jwt.sign(
    {
      userId,
    },
    secret,
    {
      expiresIn: '7d',
    }
  );
}

// ============================================
// ارسال OTP
// ============================================

exports.sendOtp = async (req, res) => {
  try {
    const {
      phone,
      mode,
    } = req.body;

    if (!phone || phone.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'شماره موبایل معتبر نیست',
      });
    }

    if (mode === 'login') {
      const existingUser =
        await prisma.user.findUnique({
          where: {
            phone,
          },
        });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          notRegistered: true,
          message:
            'این شماره ثبت‌نام نشده. لطفاً ابتدا ثبت‌نام کن.',
        });
      }
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    // کدهای قبلیِ همین شماره رو پاک کن، بعد کد تازه رو در دیتابیس ذخیره کن
    // (نه در حافظه‌ی پروسه) — تا با ری‌استارت سرور یا چند اینستنس بودن از
    // بین نره
    await prisma.otpCode.deleteMany({ where: { phone } });
    await prisma.otpCode.create({
      data: { phone, code, expires_at: expiresAt },
    });

    const smsResult = await sendOtpSms(phone, code);

    if (smsResult.success) {
      return res.json({
        success: true,
        message: 'کد تایید پیامک شد',
      });
    }

    // اگه سرویس پیامک هنوز پیکربندی نشده یا خطا داد، به‌جای اینکه کاربر
    // گیر بیفته، کد رو توی لاگ سرور نشون می‌دیم (فقط برای توسعه/تست)
    console.warn('⚠️ ارسال پیامک ناموفق بود، کد در کنسول:', smsResult.error);
    console.log(
      `📱 کد تایید برای ${phone}: ${code}`
    );

    return res.json({
      success: true,
      message: 'کد تایید ارسال شد',
      devCode: code,
      smsError: smsResult.error,
    });
  } catch (error) {
    console.error(
      'SEND OTP ERROR:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

// ============================================
// تایید OTP
// ============================================

exports.verifyOtp = async (req, res) => {
  try {
    const {
      phone,
      otp,
      code,
    } = req.body;

    // پشتیبانی از هر دو نام
    const submittedCode =
      otp || code;

    const record =
      await prisma.otpCode.findFirst({
        where: { phone },
        orderBy: { created_at: 'desc' },
      });

    if (
      !record ||
      record.code !== submittedCode ||
      Date.now() > new Date(record.expires_at).getTime()
    ) {
      return res.status(400).json({
        success: false,
        message:
          'کد وارد شده صحیح نیست یا منقضی شده',
      });
    }

    await prisma.otpCode.deleteMany({ where: { phone } });

    const user =
      await prisma.user.findUnique({
        where: {
          phone,
        },
      });

    // کاربر جدید
    if (!user) {
      return res.json({
        success: true,
        isNewUser: true,
      });
    }

    // آخرین ورود
    await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        lastLoginAt: new Date(),

        lastLoginDevice: (
          req.headers['user-agent'] ||
          ''
        ).slice(0, 255),
      },
    });

    const token =
      generateToken(user.id);

    return res.json({
      success: true,
      isNewUser: false,

      data: {
        token,

        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          username: user.username,
          email: user.email,
          bio: user.bio,
          avatar: user.avatar,
          birthdate: user.birthdate,
          role: user.role,
          province: user.province,
          city: user.city,
        },
      },
    });
  } catch (error) {
    console.error(
      'VERIFY OTP ERROR:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

// ============================================
// تکمیل ثبت‌نام
// ============================================

exports.completeSignup = async (
  req,
  res
) => {
  try {
    const {
      phone,
      name,
      role,
    } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message:
          'شماره موبایل الزامی است',
      });
    }

    const siteSettings =
      await prisma.siteSetting.findUnique({
        where: { id: 1 },
      });

    if (siteSettings && siteSettings.registration_open === false) {
      return res.status(403).json({
        success: false,
        message:
          'ثبت‌نام کاربران جدید در حال حاضر بسته است',
      });
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          phone,
        },
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          'این شماره قبلاً ثبت شده',
      });
    }

    const user =
      await prisma.user.create({
        data: {
          phone,
          name,
          role: role || 'user',
        },
      });

    const token =
      generateToken(user.id);

    return res.json({
      success: true,

      data: {
        token,

        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          username: user.username,
          email: user.email,
          bio: user.bio,
          avatar: user.avatar,
          birthdate: user.birthdate,
          role: user.role,
          province: user.province,
          city: user.city,
        },
      },
    });
  } catch (error) {
    console.error(
      'COMPLETE SIGNUP ERROR:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};