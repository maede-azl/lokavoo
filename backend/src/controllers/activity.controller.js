// activity.controller.js
const prisma = require('../config/db');

// ثبت بازدید یک کسب‌وکار توسط کاربر لاگین‌شده
exports.recordView = async (req, res) => {
  try {
    const userId = req.user.id;
    const businessId = Number(req.params.businessId);

    if (!businessId) {
      return res.status(400).json({ success: false, message: 'کسب‌وکار نامعتبر است' });
    }

    // برای جلوگیری از ثبت انبوه (مثلاً هر بار رفرش صفحه)، اگه بازدید قبلی
    // در ۱۰ دقیقه‌ی اخیر برای همین کسب‌وکار ثبت شده، رکورد جدید نساز
    const recent = await prisma.viewHistory.findFirst({
      where: {
        user_id: userId,
        business_id: businessId,
        viewed_at: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });

    if (recent) {
      return res.json({ success: true, deduped: true });
    }

    await prisma.viewHistory.create({
      data: { user_id: userId, business_id: businessId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('RECORD VIEW ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// گرفتن لیست بازدیدهای اخیر کاربر (برای نمایش در پروفایل)
exports.getRecentViews = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const views = await prisma.viewHistory.findMany({
      where: { user_id: userId },
      orderBy: { viewed_at: 'desc' },
      take: limit,
      include: {
        business: {
          select: { id: true, name: true, category: { select: { name: true } } },
        },
      },
    });

    // حذف تکراری‌ها (فقط جدیدترین بازدید هر کسب‌وکار رو نگه‌دار)
    const seen = new Set();
    const unique = [];
    for (const v of views) {
      if (!seen.has(v.business_id)) {
        seen.add(v.business_id);
        unique.push({
          businessId: v.business.id,
          name: v.business.name,
          category: v.business.category?.name || null,
          viewedAt: v.viewed_at,
        });
      }
    }

    res.json({ success: true, data: unique });
  } catch (error) {
    console.error('GET RECENT VIEWS ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// ثبت یک جستجوی کاربر
exports.recordSearch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, message: 'عبارت جستجو خالی است' });
    }

    const trimmed = query.trim().slice(0, 255);

    // اگه همین عبارت توی ۵ دقیقه‌ی اخیر ثبت شده، دوباره ثبت نکن
    const recent = await prisma.searchHistory.findFirst({
      where: {
        user_id: userId,
        query: trimmed,
        created_at: { gte: new Date(Date.now() - 5 * 60 * 1000) },
      },
    });

    if (recent) {
      return res.json({ success: true, deduped: true });
    }

    await prisma.searchHistory.create({
      data: { user_id: userId, query: trimmed },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('RECORD SEARCH ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// گرفتن جستجوهای اخیر کاربر (برای نمایش در پروفایل)
exports.getRecentSearches = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(Number(req.query.limit) || 6, 20);

    const searches = await prisma.searchHistory.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 30,
      select: { query: true },
    });

    const seen = new Set();
    const unique = [];
    for (const s of searches) {
      const key = s.query.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(s.query);
      }
      if (unique.length >= limit) break;
    }

    res.json({ success: true, data: unique });
  } catch (error) {
    console.error('GET RECENT SEARCHES ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// تابع کمکی داخلی — از کنترلرهای دیگه (review، bookmark، profile) هم صدا زده می‌شه
exports.logActivity = async ({ userId, type, message, businessId = null }) => {
  try {
    await prisma.activityLog.create({
      data: { user_id: userId, type, message, business_id: businessId },
    });
  } catch (error) {
    console.error('LOG ACTIVITY ERROR:', error);
    // عمداً throw نمی‌کنیم؛ خطای لاگ نباید عملیات اصلی رو fail کنه
  }
};

// گرفتن Timeline فعالیت‌های اخیر کاربر (برای پروفایل)
exports.getTimeline = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(Number(req.query.limit) || 10, 30);

    const logs = await prisma.activityLog.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    res.json({
      success: true,
      data: logs.map((l) => ({
        id: l.id,
        type: l.type,
        message: l.message,
        businessId: l.business_id,
        createdAt: l.created_at,
      })),
    });
  } catch (error) {
    console.error('GET TIMELINE ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};