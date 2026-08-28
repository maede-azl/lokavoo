// bookmark.controller
const prisma = require('../config/db');
const { logActivity } = require('./activity.controller');
 
// گرفتن لیست بوکمارک‌های کاربر
exports.getMyBookmarks = async (req, res) => {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { user_id: req.user.id },
      include: {
        business: {
          include: {
            images: { where: { is_primary: true }, take: 1 },
            category: true,
            reviews: { select: { rating: true } }, // ← اضافه شد برای محاسبه‌ی امتیاز
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
 
    // فرمت‌دهی خروجی: محاسبه‌ی میانگین امتیاز و تعداد نظرات
    const data = bookmarks.map((bm) => {
      const reviews = bm.business.reviews || [];
      const avgRating =
        reviews.length > 0
          ? Number((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1))
          : 0;
 
      return {
        bookmarkId: bm.id,
        bookmarkedAt: bm.created_at,
        business: {
          id: bm.business.id,
          name: bm.business.name,
          description: bm.business.description,
          address: bm.business.address,
          status: bm.business.status,
          category: bm.business.category
            ? { name: bm.business.category.name, key_name: bm.business.category.key_name }
            : null,
          image: bm.business.images?.[0]?.image_url || null,
          avgRating,
          reviewsCount: reviews.length,
        },
      };
    });
 
    res.json({ success: true, data });
  } catch (error) {
    console.error('GET BOOKMARKS ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};
 
// toggle بوکمارک (اگه هست حذف کن، اگه نیست بساز) — راحت‌ترین حالت برای دکمه‌ی آیکون
exports.toggleBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const businessId = Number(req.params.businessId);
 
    if (!businessId) {
      return res.status(400).json({ success: false, message: 'کسب‌وکار نامعتبر است' });
    }
 
    const existing = await prisma.bookmark.findUnique({
      where: {
        user_id_business_id: { user_id: userId, business_id: businessId },
      },
    });
 
    // برای پیام تایم‌لاین به اسم کسب‌وکار نیاز داریم
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true },
    });
 
    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
 
      await logActivity({
        userId,
        type: 'bookmark_remove',
        message: `${biz?.name || 'یک کسب‌وکار'} را از بوکمارک‌ها حذف کردید`,
        businessId,
      });
 
      return res.json({ success: true, bookmarked: false, message: 'از بوکمارک‌ها حذف شد' });
    }
 
    await prisma.bookmark.create({
      data: { user_id: userId, business_id: businessId },
    });
 
    await logActivity({
      userId,
      type: 'bookmark_add',
      message: `${biz?.name || 'یک کسب‌وکار'} را به بوکمارک‌ها اضافه کردید`,
      businessId,
    });
 
    res.json({ success: true, bookmarked: true, message: 'به بوکمارک‌ها اضافه شد' });
  } catch (error) {
    console.error('TOGGLE BOOKMARK ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};
 
// چک کردن وضعیت بوکمارک یه کسب‌وکار خاص (برای لود اولیه صفحه Detail)
exports.checkBookmarkStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const businessId = Number(req.params.businessId);
 
    const existing = await prisma.bookmark.findUnique({
      where: {
        user_id_business_id: { user_id: userId, business_id: businessId },
      },
    });
 
    res.json({ success: true, bookmarked: !!existing });
  } catch (error) {
    console.error('CHECK BOOKMARK ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};
