// src/controllers/auth.controller.js
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');   // ← این خط حیاتیه

const otpStore = {};

function generateOtp() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production', { expiresIn: '7d' });
}

// ارسال کد تایید
exports.sendOtp = async (req, res) => {
  try {
    const { phone, mode } = req.body;

    if (!phone || phone.length < 10) {
      return res.status(400).json({
        success: false,
        message: "شماره موبایل معتبر نیست",
      });
    }

    if (mode === "login") {
      const existingUser = await prisma.user.findUnique({ where: { phone } });
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          notRegistered: true,
          message: "این شماره ثبت‌نام نشده. لطفاً ابتدا ثبت‌نام کن.",
        });
      }
    }

    const code = generateOtp();
    otpStore[phone] = { 
      code, 
      expires: Date.now() + 2 * 60 * 1000 
    };

    console.log(`📱 کد تایید برای ${phone}: ${code}`);

    res.json({
      success: true,
      message: "کد تایید ارسال شد",
      devCode: code,
    });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);
    res.status(500).json({ 
      success: false, 
      message: "خطای سرور" 
    });
  }
};

// تایید کد
// تایید کد
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, code } = req.body;
    const record = otpStore[phone];

    if (!record || record.code !== code || Date.now() > record.expires) {
      return res.status(400).json({ 
        success: false, 
        message: 'کد وارد شده صحیح نیست یا منقضی شده' 
      });
    }

    delete otpStore[phone];

    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      return res.json({ success: true, isNewUser: true });
    }

    // ← اینجا اضافه شد: آپدیت آخرین ورود
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginDevice: (req.headers['user-agent'] || '').slice(0, 255),
      },
    });

    const token = generateToken(user.id);
    res.json({
      success: true,
      isNewUser: false,
      data: {
        token,
        user: { 
          id: user.id, 
          name: user.name, 
          phone: user.phone, 
          role: user.role 
        },
      },
    });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// تکمیل ثبت‌نام
exports.completeSignup = async (req, res) => {
  try {
    const { phone, name, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'این شماره قبلاً ثبت شده' 
      });
    }

    const user = await prisma.user.create({
      data: { 
        phone, 
        name, 
        role: role || 'user' 
      },
    });

    const token = generateToken(user.id);
    res.json({
      success: true,
      data: {
        token,
        user: { 
          id: user.id, 
          name: user.name, 
          phone: user.phone, 
          role: user.role 
        },
      },
    });
  } catch (error) {
    console.error("COMPLETE SIGNUP ERROR:", error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};