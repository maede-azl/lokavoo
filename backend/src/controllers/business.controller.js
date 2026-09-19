const prisma = require('../config/db');

const { z } = require('zod');

const { logActivity } = require('./activity.controller');
const { getFileUrl } = require('./../services/storage');

const fs = require('fs');

const path = require('path');

// ============================================

// Validation Schemas

// ============================================

const createBusinessSchema = z.object({

  name: z.string().min(3, 'نام حداقل ۳ کاراکتر').max(255),

  description: z.string().optional(),

  category_id: z.coerce.number().int().positive(),

  phone: z.string().optional(),

  address: z.string().optional(),

  city: z.string().optional(),

  province: z.string().optional(),

  latitude: z.coerce.number().optional(),

  longitude: z.coerce.number().optional(),

  opening_time: z.string().optional(),

  closing_time: z.string().optional(),

});

const reviewSchema = z.object({

  rating: z.coerce.number().int().min(1, 'امتیاز الزامی').max(5),

  comment: z.string().min(4, 'نظر باید حداقل ۴ کاراکتر باشه').max(1000).optional(),

});

// ============================================

// ثبت کسب‌وکار جدید

// ============================================

exports.createBusiness = async (req, res) => {

  try {

    const userId = req.user.id;

    const siteSettings = await prisma.siteSetting.findUnique({ where: { id: 1 } });
    if (siteSettings && siteSettings.registration_open === false) {
      return res.status(403).json({
        success: false,
        message: 'در حال حاضر ثبت کسب‌وکار جدید توسط مدیریت غیرفعال شده است',
      });
    }

    const validated = createBusinessSchema.parse(req.body);

    const opening_time = validated.opening_time

      ? new Date(`1970-01-01T${validated.opening_time}:00`)

      : null;

    const closing_time = validated.closing_time

      ? new Date(`1970-01-01T${validated.closing_time}:00`)

      : null;

    const business = await prisma.business.create({

      data: {

        user_id: userId,

        name: validated.name,

        description: validated.description,

        category_id: validated.category_id,

        phone: validated.phone,

        address: validated.address || req.body.manualAddress,

        city: validated.city || null,

        province: validated.province || null,

        latitude: validated.latitude,

        longitude: validated.longitude,

        opening_time,

        closing_time,

        status: siteSettings && siteSettings.auto_approve ? 'approved' : 'pending',

      },

      include: {

        category: true,

      },

    });

    if (req.files && req.files.length > 0) {

      const imageData = req.files.map((file, index) => ({

        business_id: business.id,

        image_url: getFileUrl('businesses', file),

        is_primary: index === 0,

      }));

      await prisma.businessImage.createMany({

        data: imageData,

      });

    }

    res.status(201).json({

      success: true,

      message: 'کسب‌وکار با موفقیت ثبت شد',

      data: business,

    });

  } catch (error) {

    console.error('CREATE BUSINESS ERROR:', error);

    if (error instanceof z.ZodError) {

      return res.status(400).json({

        success: false,

        errors: error.errors,

      });

    }

    res.status(500).json({

      success: false,

      message: 'خطای سرور',

    });

  }

};

// ============================================

// دریافت لیست کسب‌وکارهای تایید شده

// ============================================

exports.getBusinesses = async (req, res) => {

  try {

    const { sort } = req.query;

    const businesses = await prisma.business.findMany({

      where: {

        status: 'approved',

      },

      include: {

        category: true,

        images: true,

        reviews: {

          select: {

            rating: true,

          },

        },

      },

      orderBy: {

        created_at: 'desc',

      },

    });

    let result = businesses.map((b) => {

      const visibleReviews = b.notif_review !== false ? b.reviews : [];

      const reviewsCount = visibleReviews.length;

      const avgRating =

        reviewsCount > 0

          ? Number(

              (

                visibleReviews.reduce((sum, r) => sum + r.rating, 0) /

                reviewsCount

              ).toFixed(1)

            )

          : 0;

      const { reviews, ...rest } = b;

      return {

        ...rest,

        reviewsCount,

        avgRating,

      };

    });

    if (sort === 'rating') {

      result = result.sort(

        (a, b) =>

          b.avgRating - a.avgRating ||

          b.reviewsCount - a.reviewsCount

      );

    }

    res.json({

      success: true,

      data: result,

    });

  } catch (error) {

    console.error('GET BUSINESSES ERROR:', error);

    res.status(500).json({

      success: false,

      message: 'خطای سرور',

    });

  }

};

// ============================================

// دریافت تنظیمات کسب‌وکار (برای صفحه ویرایش)

// ============================================

exports.getBusinessSettings = async (req, res) => {

  try {

    const businessId = Number(req.params.businessId);

    const userId = req.user.id;

    if (Number.isNaN(businessId)) {

      return res.status(400).json({

        success: false,

        message: 'شناسه کسب‌وکار نامعتبر است',

      });

    }

    const business = await prisma.business.findUnique({

      where: { id: businessId },

      include: {

        category: true,

        images: {

          orderBy: { is_primary: 'desc' },

        },

      },

    });

    if (!business) {

      return res.status(404).json({

        success: false,

        message: 'کسب‌وکار پیدا نشد',

      });

    }

    if (business.user_id !== userId) {

      return res.status(403).json({

        success: false,

        message: 'دسترسی غیرمجاز',

      });

    }

    const formatTime = (date) => {

      if (!date) return null;

      const d = new Date(date);

      const h = String(d.getUTCHours()).padStart(2, '0');

      const m = String(d.getUTCMinutes()).padStart(2, '0');

      return `${h}:${m}`;

    };

    const data = {

      ...business,

      showPhone: business.show_phone !== false,
      opening_time: formatTime(business.opening_time),

      closing_time: formatTime(business.closing_time),

      images: business.images.map((img) => ({

        id: img.id,

        url: img.image_url,

        is_primary: img.is_primary,

      })),

    };

    res.json({

      success: true,

      data,

    });

  } catch (error) {

    console.error('GET BUSINESS SETTINGS ERROR:', error);

    res.status(500).json({

      success: false,

      message: 'خطای سرور',

    });

  }

};

// ============================================

// دریافت جزئیات یک کسب‌وکار

// ============================================

exports.getBusinessById = async (req, res) => {

  try {

    const { id } = req.params;

    const businessId = Number(id);

    if (Number.isNaN(businessId)) {

      return res.status(400).json({

        success: false,

        message: 'شناسه کسب‌وکار نامعتبر است',

      });

    }

    const business = await prisma.business.findUnique({

      where: {

        id: businessId,

      },

      include: {

        category: true,

        images: true,

        user: {

          select: {

            name: true,

            phone: true,

          },

        },

        reviews: {

          include: {

            user: {

              select: {

                id: true,

                name: true,

              },

            },

          },

          orderBy: {

            created_at: 'desc',

          },

        },

        products: true,

      },

    });

    if (!business) {

      return res.status(404).json({

        success: false,

        message: 'کسب‌وکار پیدا نشد',

      });

    }

    // اعمال تنظیمات نمایش در API عمومی
    const reviews = business.notif_review ? business.reviews : [];
    const reviewsCount = reviews.length;

    const avgRating =
      reviewsCount > 0
        ? Number(
            (
              reviews.reduce((sum, r) => sum + r.rating, 0) /
              reviewsCount
            ).toFixed(1)
          )
        : 0;

    res.json({
      success: true,
      data: {
        ...business,
        showPhone: business.show_phone !== false,
        phone: business.show_phone !== false ? business.phone : null,
        reviews,
        reviewsCount,
        avgRating,
      },
    });

  } catch (error) {

    console.error('GET BUSINESS BY ID ERROR:', error);

    res.status(500).json({

      success: false,

      message: 'خطای سرور',

    });

  }

};

// ============================================

// ثبت یا ویرایش نظر

// ============================================

exports.createReview = async (req, res) => {

  try {

    const userId = req.user.id;

    const businessId = Number(req.params.id);

    const validated = reviewSchema.parse(req.body);

    const business = await prisma.business.findUnique({

      where: {

        id: businessId,

      },

    });

    if (!business) {

      return res.status(404).json({

        success: false,

        message: 'کسب‌وکار پیدا نشد',

      });

    }

    const review = await prisma.review.upsert({

      where: {

        business_id_user_id: {

          business_id: businessId,

          user_id: userId,

        },

      },

      update: {

        rating: validated.rating,

        comment: validated.comment,

      },

      create: {

        business_id: businessId,

        user_id: userId,

        rating: validated.rating,

        comment: validated.comment,

      },

      include: {

        user: {

          select: {

            name: true,

          },

        },

      },

    });

    await logActivity({

      userId,

      type: 'review',

      message: `برای ${business.name} نظر ثبت کردید`,

      businessId,

    });

    res.status(201).json({

      success: true,

      message: 'نظر شما ثبت شد',

      data: review,

    });

  } catch (error) {

    console.error('CREATE REVIEW ERROR:', error);

    if (error instanceof z.ZodError) {

      return res.status(400).json({

        success: false,

        errors: error.errors,

      });

    }

    res.status(500).json({

      success: false,

      message: 'خطای سرور',

    });

  }

};

// ============================================

// دریافت کسب‌وکارهای یک دسته‌بندی

// ============================================

exports.getBusinessesByCategory = async (req, res) => {

  try {

    const { key } = req.params;

    const category = await prisma.category.findUnique({

      where: {

        key_name: key,

      },

    });

    if (!category) {

      return res.status(404).json({

        success: false,

        message: 'دسته‌بندی پیدا نشد',

      });

    }

    const businesses = await prisma.business.findMany({

      where: {

        category_id: category.id,

        status: 'approved',

        ...(req.query.city && req.query.city.trim()
          ? {
              OR: [
                { city: { equals: req.query.city.trim(), mode: 'insensitive' } },
                { address: { contains: req.query.city.trim(), mode: 'insensitive' } },
              ],
            }
          : {}),

      },

      include: {

        category: true,

        images: true,

        reviews: {

          select: {

            rating: true,

          },

        },

      },

      orderBy: {

        created_at: 'desc',

      },

    });

    const result = businesses.map((b) => {

      const visibleReviews = b.notif_review !== false ? b.reviews : [];

      const reviewsCount = visibleReviews.length;

      const avgRating =

        reviewsCount > 0

          ? Number(

              (

                visibleReviews.reduce((sum, r) => sum + r.rating, 0) /

                reviewsCount

              ).toFixed(1)

            )

          : 0;

      const { reviews, ...rest } = b;

      return {

        ...rest,

        reviewsCount,

        avgRating,

      };

    });

    res.json({

      success: true,

      category,

      data: result,

    });

  } catch (error) {

    console.error('GET BUSINESSES BY CATEGORY ERROR:', error);

    res.status(500).json({

      success: false,

      message: 'خطای سرور',

    });

  }

};

// ============================================

// ثبت کلیک تماس یا مسیریابی

// ============================================

exports.trackAction = async (req, res) => {

  try {

    const businessId = Number(req.params.id);

    const { type } = req.body;

    if (!['call', 'route'].includes(type)) {

      return res.status(400).json({

        success: false,

        message: 'type باید call یا route باشد',

      });

    }

    const field = type === 'call' ? 'call_count' : 'route_count';

    const business = await prisma.business.update({

      where: {

        id: businessId,

      },

      data: {

        [field]: {

          increment: 1,

        },

      },

      select: {

        id: true,

        call_count: true,

        route_count: true,

      },

    });

    res.json({

      success: true,

      data: business,

    });

  } catch (error) {

    console.error('TRACK ACTION ERROR:', error);

    if (error.code === 'P2025') {

      return res.status(404).json({

        success: false,

        message: 'کسب‌وکار پیدا نشد',

      });

    }

    res.status(500).json({

      success: false,

      message: 'خطای سرور',

    });

  }

};

// ============================================

// آمار داشبورد فروشنده

// ============================================

exports.getDashboardStats = async (req, res) => {

  try {

    const businessId = Number(req.params.businessId);

    const productsCount = await prisma.product.count({

      where: {

        business_id: businessId,

        active: true,

      },

    });

    const reviews = await prisma.review.findMany({

      where: {

        business_id: businessId,

      },

      select: {

        rating: true,

      },

    });

    const reviewsCount = reviews.length;

    const avgRating =

      reviewsCount > 0

        ? Number(

            (

              reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount

            ).toFixed(1)

          )

        : 0;

    const unreadMessages = await prisma.conversation.count({

      where: {

        business_id: businessId,

        unread: true,

      },

    });

    res.json({

      success: true,

      data: {

        productsCount,

        reviewsCount,

        avgRating,

        unreadMessages,

      },

    });

  } catch (error) {

    console.error('DASHBOARD STATS ERROR:', error);

    res.status(500).json({

      success: false,

      message: 'خطای سرور',

    });

  }

};

// ============================================

// آپدیت تنظیمات کسب‌وکار

// ============================================

// ============================================
// گزارشات داشبورد فروشنده
// ============================================
exports.getDashboardReports = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);
    const userId = req.user.id;

    if (Number.isNaN(businessId)) {
      return res.status(400).json({ success: false, message: 'شناسه کسب‌وکار نامعتبر است' });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        user_id: true,
        views: true,
        call_count: true,
        route_count: true,
        description: true,
        phone: true,
        opening_time: true,
        closing_time: true,
        _count: { select: { images: true, products: true } },
      },
    });

    if (!business) {
      return res.status(404).json({ success: false, message: 'کسب‌وکار پیدا نشد' });
    }

    if (business.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'دسترسی غیرمجاز' });
    }

    const now = new Date();
    const startOfMonth = new Date(now);
    startOfMonth.setDate(startOfMonth.getDate() - 30);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - 6);
    startOfWeek.setHours(0, 0, 0, 0);

    const viewHistory = await prisma.viewHistory.findMany({
      where: {
        business_id: businessId,
        viewed_at: { gte: startOfMonth },
      },
      select: { viewed_at: true },
      orderBy: { viewed_at: 'asc' },
    });

    const monthlyViews = viewHistory.length;
    const profileViews = Number(business.views || 0);

    // آمار واقعی کلیک (تماس + مسیریابی) — دیگه صفر ثابت نیست
    const productClicks = Number(business.call_count || 0) + Number(business.route_count || 0);

    // امتیاز دیده‌شدن: بر اساس کامل بودن پروفایل + اشتراک فعال + بازدید ماهانه
    const activePlan = await getActivePlan(businessId);
    let visibilityScore = 0;
    if (business.description && business.description.trim().length > 20) visibilityScore += 20;
    if (business._count.images > 0) visibilityScore += 20;
    if (business._count.products > 0) visibilityScore += 15;
    if (business.opening_time && business.closing_time) visibilityScore += 10;
    if (business.phone) visibilityScore += 10;
    if (activePlan?.search_priority) visibilityScore += Math.min(activePlan.search_priority * 2, 15);
    visibilityScore += Math.min(Math.round(monthlyViews / 5), 10);
    visibilityScore = Math.min(visibilityScore, 100);

    const dayNames = [
      'یکشنبه',
      'دوشنبه',
      'سه‌شنبه',
      'چهارشنبه',
      'پنجشنبه',
      'جمعه',
      'شنبه',
    ];

    const weeklyViews = [];
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      const count = viewHistory.filter((item) => {
        const d = new Date(item.viewed_at);
        return d >= day && d < nextDay;
      }).length;

      weeklyViews.push({ day: dayNames[day.getDay()], count });
    }

    const maxWeekly = Math.max(...weeklyViews.map((item) => item.count), 0);
    const normalizedWeeklyViews = weeklyViews.map((item) => ({
      day: item.day,
      count: item.count,
      value: maxWeekly > 0 ? Math.round((item.count / maxWeekly) * 100) : 0,
    }));

    return res.json({
      success: true,
      data: {
        monthlyViews,
        profileViews,
        productClicks,
        visibilityScore,
        weeklyViews: normalizedWeeklyViews,
      },
    });
  } catch (error) {
    console.error('DASHBOARD REPORTS ERROR:', error);
    return res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

exports.updateBusinessSettings = async (req, res) => {

  try {

    const businessId = Number(req.params.businessId);

    const userId = req.user.id;

    const existing = await prisma.business.findUnique({

      where: { id: businessId },

      select: { user_id: true },

    });

    if (!existing) {

      return res.status(404).json({ success: false, message: 'کسب‌وکار پیدا نشد' });

    }

    if (existing.user_id !== userId) {

      return res.status(403).json({ success: false, message: 'دسترسی غیرمجاز' });

    }

    if (!req.body || Object.keys(req.body).length === 0) {

      return res.status(400).json({

        success: false,

        message: 'داده‌ای برای بروزرسانی ارسال نشده است',

      });

    }

    const {

      name,

      description,

      phone,

      website,

      address,

      showPhone,

      shipping_cost,

      delivery_enabled,

      pickup_enabled,

      card_number,

      sheba_number,

      notif_order,

      notif_message,

      notif_review,

    } = req.body;

    const data = {};

    if (name !== undefined) data.name = String(name).trim();

    if (description !== undefined) data.description = description;

    if (phone !== undefined) data.phone = phone ? String(phone).trim() : null;

    if (website !== undefined) data.website = website ? String(website).trim() : null;

    if (address !== undefined) data.address = address ? String(address).trim() : null;

    if (showPhone !== undefined) data.show_phone = showPhone === true || showPhone === 'true';

    if (shipping_cost !== undefined) data.shipping_cost = Number(shipping_cost) || 0;

    if (delivery_enabled !== undefined)

      data.delivery_enabled = delivery_enabled === true || delivery_enabled === 'true';

    if (pickup_enabled !== undefined)

      data.pickup_enabled = pickup_enabled === true || pickup_enabled === 'true';

    if (card_number !== undefined) data.card_number = card_number;

    if (sheba_number !== undefined) data.sheba_number = sheba_number;

    if (notif_order !== undefined)

      data.notif_order = notif_order === true || notif_order === 'true';

    if (notif_message !== undefined)

      data.notif_message = notif_message === true || notif_message === 'true';

    if (notif_review !== undefined)

      data.notif_review = notif_review === true || notif_review === 'true';

    if (Object.keys(data).length === 0) {

      return res.status(400).json({

        success: false,

        message: 'هیچ فیلدی برای بروزرسانی ارسال نشده است',

      });

    }

    const business = await prisma.business.update({

      where: { id: businessId },

      data,

      include: {

        category: true,

        images: true,

      },

    });

    res.json({

      success: true,

      message: 'تنظیمات با موفقیت ذخیره شد',

      data: business,

    });

  } catch (error) {

    console.error('UPDATE BUSINESS SETTINGS ERROR:', error);

    res.status(500).json({ success: false, message: 'خطای سرور' });

  }

};

// ============================================

// ویرایش کامل کسب‌وکار (با تصویر)

// ============================================

exports.updateBusiness = async (req, res) => {

  try {

    const businessId = Number(req.params.businessId);

    const userId = req.user.id;

    if (Number.isNaN(businessId)) {

      return res.status(400).json({

        success: false,

        message: 'شناسه کسب‌وکار نامعتبر است',

      });

    }

    const existing = await prisma.business.findUnique({

      where: { id: businessId },

      select: { user_id: true },

    });

    if (!existing) {

      return res.status(404).json({

        success: false,

        message: 'کسب‌وکار پیدا نشد',

      });

    }

    if (existing.user_id !== userId) {

      return res.status(403).json({

        success: false,

        message: 'دسترسی غیرمجاز',

      });

    }

    const {

      name,

      description,

      category_id,

      phone,

      address,

      city,

      province,

      latitude,

      longitude,

      opening_time,

      closing_time,

      removed_image_ids,

    } = req.body;

    const data = {};

    if (name !== undefined) data.name = String(name).trim();

    if (description !== undefined) data.description = description || null;

    if (category_id !== undefined) data.category_id = Number(category_id);

    if (phone !== undefined) data.phone = phone ? String(phone).trim() : null;

    if (address !== undefined) data.address = address ? String(address).trim() : null;

    if (city !== undefined) data.city = city ? String(city).trim() : null;

    if (province !== undefined) data.province = province ? String(province).trim() : null;

    if (latitude !== undefined) data.latitude = latitude ? Number(latitude) : null;

    if (longitude !== undefined) data.longitude = longitude ? Number(longitude) : null;

    if (opening_time && typeof opening_time === 'string' && opening_time.includes(':')) {

      const [hour, minute] = opening_time.split(':');

      const h = String(hour).padStart(2, '0');

      const m = String(minute).padStart(2, '0').slice(0, 2);

      const date = new Date(`1970-01-01T${h}:${m}:00`);

      if (!isNaN(date.getTime())) {

        data.opening_time = date;

      }

    }

    if (closing_time && typeof closing_time === 'string' && closing_time.includes(':')) {

      const [hour, minute] = closing_time.split(':');

      const h = String(hour).padStart(2, '0');

      const m = String(minute).padStart(2, '0').slice(0, 2);

      const date = new Date(`1970-01-01T${h}:${m}:00`);

      if (!isNaN(date.getTime())) {

        data.closing_time = date;

      }

    }

    const business = await prisma.business.update({

      where: { id: businessId },

      data,

      include: {

        category: true,

        images: true,

      },

    });

    // حذف تصاویر انتخاب‌شده

    if (removed_image_ids) {

      try {

        let idsToRemove = [];

        if (typeof removed_image_ids === 'string') {

          idsToRemove = JSON.parse(removed_image_ids);

        } else if (Array.isArray(removed_image_ids)) {

          idsToRemove = removed_image_ids;

        }

        idsToRemove = idsToRemove.map(Number).filter((id) => !isNaN(id));

        if (idsToRemove.length > 0) {

          const imagesToDelete = await prisma.businessImage.findMany({

            where: {

              id: { in: idsToRemove },

              business_id: businessId,

            },

          });

          for (const img of imagesToDelete) {

            if (img.image_url && img.image_url.startsWith('/uploads/')) {

              const filePath = path.join(

                __dirname,

                '..',

                '..',

                img.image_url.replace(/^\/+/, '')

              );

              if (fs.existsSync(filePath)) {

                try {

                  fs.unlinkSync(filePath);

                } catch (e) {

                  console.error('Error deleting file:', filePath, e);

                }

              }

            }

          }

          await prisma.businessImage.deleteMany({

            where: {

              id: { in: idsToRemove },

              business_id: businessId,

            },

          });

        }

      } catch (e) {

        console.error('Error removing images:', e);

      }

    }

    // اضافه کردن تصاویر جدید

    if (req.files && req.files.length > 0) {

      const imageData = req.files.map((file, index) => ({

        business_id: businessId,

        image_url: getFileUrl('businesses', file),

        is_primary: index === 0,

      }));

      await prisma.businessImage.createMany({

        data: imageData,

      });

    }

    const updated = await prisma.business.findUnique({

      where: { id: businessId },

      include: {

        category: true,

        images: true,

      },

    });

    res.json({

      success: true,

      message: 'کسب‌وکار با موفقیت ویرایش شد',

      data: updated,

    });

  } catch (error) {

    console.error('UPDATE BUSINESS ERROR:', error);

    res.status(500).json({

      success: false,

      message: 'خطای سرور',

    });

  }

};

// ============================================

// سرچ پیشرفته کسب‌وکارها

// ============================================

exports.searchBusinesses = async (req, res) => {

  try {

    const {

      q = '',

      category = 'all',

      city = '',

      openOnly = 'false',

      minRate = 0,

      maxDist = 99,

      sort = 'relevance',

      lat,

      lng,

      page = 1,

      limit = 50,

    } = req.query;

    const where = {

      status: 'approved',

    };

    if (q.trim()) {

      where.OR = [

        {

          name: {

            contains: q.trim(),

            mode: 'insensitive',

          },

        },

        {

          description: {

            contains: q.trim(),

            mode: 'insensitive',

          },

        },

        {

          address: {

            contains: q.trim(),

            mode: 'insensitive',

          },

        },

      ];

    }

    if (category && category !== 'all') {

      const cat = await prisma.category.findUnique({

        where: {

          key_name: category,

        },

      });

      if (cat) {

        where.category_id = cat.id;

      }

    }

    const cityValue = city.trim();

    if (cityValue) {

      // اولویت با فیلد ساخت‌یافته‌ی city است (دقیق‌تر)؛ برای کسب‌وکارهای قدیمی
      // که هنوز city ساخت‌یافته ندارن، به آدرس متنی هم بازگشت می‌کنیم.
      // این فیلتر باید با فیلتر متن جستجو (q) به‌صورت AND ترکیب بشه، نه OR —
      // پس اگه قبلاً where.OR برای q ست شده، اونو داخل AND می‌بریم.
      const cityCondition = {
        OR: [
          { city: { equals: cityValue, mode: 'insensitive' } },
          { address: { contains: cityValue, mode: 'insensitive' } },
        ],
      };

      if (where.OR) {
        const existingOr = where.OR;
        delete where.OR;
        where.AND = [...(where.AND || []), { OR: existingOr }, cityCondition];
      } else {
        where.AND = [...(where.AND || []), cityCondition];
      }

    }

    let businesses = await prisma.business.findMany({

      where,

      include: {

        category: true,

        images: {

          where: {

            is_primary: true,

          },

          take: 1,

        },

        reviews: {

          select: {

            rating: true,

          },

        },

      },

      orderBy: {

        created_at: 'desc',

      },

    });

    businesses = businesses.map((b) => {

      const visibleReviews = b.notif_review !== false ? b.reviews : [];

      const reviewsCount = visibleReviews.length;

      const avgRating =

        reviewsCount > 0

          ? Number(

              (

                visibleReviews.reduce((sum, r) => sum + r.rating, 0) /

                reviewsCount

              ).toFixed(1)

            )

          : 0;

      let isOpen = false;

      if (b.opening_time && b.closing_time) {

        const now = new Date();

        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const open = new Date(b.opening_time);

        const close = new Date(b.closing_time);

        const openMinutes = open.getHours() * 60 + open.getMinutes();

        const closeMinutes = close.getHours() * 60 + close.getMinutes();

        if (closeMinutes > openMinutes) {

          isOpen =

            currentMinutes >= openMinutes && currentMinutes < closeMinutes;

        } else {

          isOpen =

            currentMinutes >= openMinutes || currentMinutes < closeMinutes;

        }

      }

      let distance = null;

      if (

        lat !== undefined &&

        lng !== undefined &&

        b.latitude !== null &&

        b.longitude !== null

      ) {

        const R = 6371;

        const dLat =

          ((Number(b.latitude) - Number(lat)) * Math.PI) / 180;

        const dLon =

          ((Number(b.longitude) - Number(lng)) * Math.PI) / 180;

        const a =

          Math.sin(dLat / 2) * Math.sin(dLat / 2) +

          Math.cos((Number(lat) * Math.PI) / 180) *

            Math.cos((Number(b.latitude) * Math.PI) / 180) *

            Math.sin(dLon / 2) *

            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        distance = Number((R * c).toFixed(2));

      }

      const { reviews, ...rest } = b;

      return {

        ...rest,

        reviewsCount,

        avgRating,

        isOpen,

        distance,

        open: isOpen,

        rating: avgRating,

        dist: distance ?? 99,

        verified: true,

        amenities: [

          ...(b.delivery_enabled ? ['ارسال'] : []),

          ...(b.pickup_enabled ? ['کارتی'] : []),

        ],

        sub: b.category?.name || '',

        cat: b.category?.key_name || '',

        ribbon: null,

        addr: b.address || '',

      };

    });

    if (Number(minRate) > 0) {

      businesses = businesses.filter((b) => b.avgRating >= Number(minRate));

    }

    if (openOnly === 'true') {

      businesses = businesses.filter((b) => b.isOpen);

    }

    if (

      Number(maxDist) < 99 &&

      lat !== undefined &&

      lng !== undefined

    ) {

      businesses = businesses.filter(

        (b) => b.distance !== null && b.distance <= Number(maxDist)

      );

    }

    if (sort === 'rating') {

      businesses.sort(

        (a, b) =>

          b.avgRating - a.avgRating || b.reviewsCount - a.reviewsCount

      );

    } else if (sort === 'dist' && lat !== undefined && lng !== undefined) {

      businesses.sort(

        (a, b) => (a.distance ?? 999) - (b.distance ?? 999)

      );

    } else if (sort === 'new') {

      businesses.sort(

        (a, b) => new Date(b.created_at) - new Date(a.created_at)

      );

    }

    const pageNumber = Math.max(1, Number(page) || 1);

    const limitNumber = Math.max(1, Number(limit) || 50);

    const start = (pageNumber - 1) * limitNumber;

    const paginated = businesses.slice(start, start + limitNumber);

    res.json({

      success: true,

      total: businesses.length,

      page: pageNumber,

      limit: limitNumber,

      data: paginated,

    });

  } catch (error) {

    console.error('SEARCH BUSINESSES ERROR:', error);

    res.status(500).json({

      success: false,

      message: 'خطای سرور',

    });

  }

};

// ============================================

// دریافت لیست کسب‌وکارهای من

// ============================================

exports.getMyBusinesses = async (req, res) => {
  try {
    const businesses = await prisma.business.findMany({
      where: { user_id: req.user.id },
      select: {
        id: true,
        name: true,
        status: true,
        category: { select: { name: true } },
        images: {
          select: {
            id: true,
            image_url: true,
            is_primary: true,
            created_at: true,
          },
          orderBy: [
            { is_primary: 'desc' },
            { created_at: 'asc' },
          ],
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const data = businesses.map((business) => {
      const primaryImage =
        business.images?.find((image) => image.is_primary) ||
        business.images?.[0] ||
        null;

      return {
        ...business,
        primaryImage: primaryImage?.image_url || null,
      };
    });

    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('GET MY BUSINESSES ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

// ============================================

// حذف کسب‌وکار

// ============================================

exports.deleteBusiness = async (req, res) => {

  try {

    const businessId = Number(req.params.businessId);

    const userId = req.user.id;

    if (Number.isNaN(businessId)) {

      return res.status(400).json({

        success: false,

        message: 'شناسه کسب‌وکار نامعتبر است',

      });

    }

    const business = await prisma.business.findUnique({

      where: {

        id: businessId,

      },

      select: {

        user_id: true,

      },

    });

    if (!business) {

      return res.status(404).json({

        success: false,

        message: 'کسب‌وکار پیدا نشد',

      });

    }

    if (business.user_id !== userId) {

      return res.status(403).json({

        success: false,

        message: 'دسترسی غیرمجاز',

      });

    }

    await prisma.businessImage.deleteMany({

      where: {

        business_id: businessId,

      },

    });

    await prisma.product.deleteMany({

      where: {

        business_id: businessId,

      },

    });

    await prisma.review.deleteMany({

      where: {

        business_id: businessId,

      },

    });

    await prisma.business.delete({

      where: {

        id: businessId,

      },

    });

    res.json({

      success: true,

      message: 'کسب‌وکار با موفقیت حذف شد',

    });

  } catch (error) {

    console.error('DELETE BUSINESS ERROR:', error);

    res.status(500).json({

      success: false,

      message: 'خطای سرور',

    });

  }

};

// ============================================
// تبلیغات و پروموشن (سمت فروشنده)
// ============================================
const { canAdvertise, getActivePlan } = require('../utils/subscriptionHelper');

const PROMO_TYPES = {
  'home_featured': { label: 'نمایش در صفحه اصلی', price: 300000, days: 14, requiresAdvertising: true },
  'category_banner': { label: 'بنر ویژه دسته‌بندی', price: 450000, days: 30, requiresAdvertising: true },
  'top_badge': { label: 'نشان فروشگاه برتر', price: 180000, days: 7, requiresAdvertising: true },
  'verified_badge': { label: 'نشان کسب‌وکار تایید‌شده', price: 250000, days: 365, requiresAdvertising: false },
};

exports.getPromoTypes = async (req, res) => {
  res.json({
    success: true,
    data: Object.entries(PROMO_TYPES).map(([key, v]) => ({ key, ...v })),
  });
};

exports.getMyPromos = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { user_id: true },
    });
    if (!business || business.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'دسترسی غیرمجاز' });
    }

    const promos = await prisma.promo.findMany({
      where: { business_id: businessId },
      orderBy: { created_at: 'desc' },
    });

    res.json({ success: true, data: promos });
  } catch (error) {
    console.error('GET MY PROMOS ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

exports.requestPromo = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);
    const { type } = req.body;

    const typeInfo = PROMO_TYPES[type];
    if (!typeInfo) {
      return res.status(400).json({ success: false, message: 'نوع تبلیغ نامعتبر است' });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { user_id: true },
    });
    if (!business || business.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'دسترسی غیرمجاز' });
    }

    // تبلیغات واقعی (نه نشان تایید) فقط برای پلن‌های رشد به بالا فعاله
    if (typeInfo.requiresAdvertising) {
      const allowed = await canAdvertise(businessId);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'برای خرید تبلیغ باید اشتراک «رشد» یا بالاتر داشته باشید',
          code: 'SUBSCRIPTION_REQUIRED',
        });
      }
    }

    const promo = await prisma.promo.create({
      data: {
        business_id: businessId,
        type: typeInfo.label,
        price: typeInfo.price,
        days: typeInfo.days,
        status: 'pending',
        visible: false,
      },
    });

    res.status(201).json({ success: true, data: promo });
  } catch (error) {
    console.error('REQUEST PROMO ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};
