//business.controller
const prisma = require('../config/db');
const { z } = require('zod');
const { logActivity } = require('./activity.controller');
const { getActivePlan } = require('../utils/subscriptionHelper');

// ============================================
// Validation Schemas
// ============================================
const createBusinessSchema = z.object({
  name: z.string().min(3, 'نام حداقل ۳ کاراکتر').max(255),
  description: z.string().optional(),
  category_id: z.coerce.number().int().positive(),
  phone: z.string().optional(),
  address: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  opening_time: z.string().optional(),
  closing_time: z.string().optional(),
});

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'امتیاز الزامیه').max(5),
  comment: z.string().min(4, 'نظر باید حداقل ۴ کاراکتر باشه').max(1000).optional(),
});

// ============================================
// ثبت کسب‌وکار جدید
// ============================================
exports.createBusiness = async (req, res) => {
  try {
    const userId = req.user.id;
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
        latitude: validated.latitude,
        longitude: validated.longitude,
        opening_time,
        closing_time,
        status: 'pending',
      },
      include: { category: true },
    });

    if (req.files && req.files.length > 0) {
  const plan = await getActivePlan(business.id);
  const maxImages = plan?.max_images ?? 20;

  if (req.files.length > maxImages) {
    // تصاویر اضافی رو قبول نکن — فقط تا سقف مجاز
    req.files = req.files.slice(0, maxImages);
  }
}

    if (req.files && req.files.length > 0) {
      const imageData = req.files.map((file, index) => ({
        business_id: business.id,
        image_url: `/uploads/businesses/${file.filename}`,
        is_primary: index === 0,
      }));
      await prisma.businessImage.createMany({ data: imageData });
    }

    res.status(201).json({
      success: true,
      message: 'کسب‌وکار با موفقیت ثبت شد',
      data: business,
    });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// ============================================
// دریافت لیست کسب‌وکارهای تایید شده
// ============================================
exports.getBusinesses = async (req, res) => {
  try {
    const { sort } = req.query;

    const businesses = await prisma.business.findMany({
      where: { status: 'approved' },
      include: {
        category: true,
        images: true,
        reviews: { select: { rating: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    let result = businesses.map((b) => {
      const reviewsCount = b.reviews.length;
      const avgRating =
        reviewsCount > 0
          ? Number(
              (b.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount).toFixed(1)
            )
          : 0;
      const { reviews, ...rest } = b;
      return { ...rest, reviewsCount, avgRating };
    });

    if (sort === 'rating') {
      result = result.sort(
        (a, b) => b.avgRating - a.avgRating || b.reviewsCount - a.reviewsCount
      );
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// ============================================
// دریافت جزئیات یک کسب‌وکار خاص
// ============================================
exports.getBusinessById = async (req, res) => {
  try {
    const { id } = req.params;

    const business = await prisma.business.findUnique({
      where: { id: Number(id) },
      include: {
        category: true,
        images: true,
        user: { select: { name: true, phone: true } },
        reviews: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { created_at: 'desc' },
        },
        products: true,
      },
    });

    if (!business) {
      return res.status(404).json({ success: false, message: 'کسب‌وکار پیدا نشد' });
    }

    const reviewsCount = business.reviews.length;
    const avgRating =
      reviewsCount > 0
        ? Number(
            (business.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount).toFixed(1)
          )
        : 0;

    res.json({
      success: true,
      data: { ...business, reviewsCount, avgRating },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// ============================================
// ثبت یا ویرایش نظر برای یک کسب‌وکار
// ============================================
exports.createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const businessId = Number(req.params.id);
    const validated = reviewSchema.parse(req.body);

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return res.status(404).json({ success: false, message: 'کسب‌وکار پیدا نشد' });
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
      include: { user: { select: { name: true } } },
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
    console.error(error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// ============================================
// دریافت کسب‌وکارهای یک دسته‌بندی با key_name
// ============================================
exports.getBusinessesByCategory = async (req, res) => {
  try {
    const { key } = req.params;

    const category = await prisma.category.findUnique({
      where: { key_name: key },
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
      },
      include: {
        category: true,
        images: true,
        reviews: { select: { rating: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const result = businesses.map((b) => {
      const reviewsCount = b.reviews.length;
      const avgRating =
        reviewsCount > 0
          ? Number(
              (b.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount).toFixed(1)
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
    res.status(500).json({ success: false, message: 'خطای سرور' });
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
      return res.status(400).json({ success: false, message: 'type باید call یا route باشد' });
    }

    const field = type === 'call' ? 'call_count' : 'route_count';

    const business = await prisma.business.update({
      where: { id: businessId },
      data: {
        [field]: { increment: 1 },
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
    console.error(error);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'کسب‌وکار پیدا نشد' });
    }
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// ============================================
// آمار داشبورد فروشنده
// ============================================
exports.getDashboardStats = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);

    const productsCount = await prisma.product.count({
      where: { business_id: businessId, active: true },
    });

    const reviews = await prisma.review.findMany({
      where: { business_id: businessId },
      select: { rating: true },
    });

    const reviewsCount = reviews.length;
    const avgRating =
      reviewsCount > 0
        ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount).toFixed(1))
        : 0;

    const unreadMessages = await prisma.conversation.count({
      where: { business_id: businessId, unread: true },
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
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// ============================================
// آپدیت تنظیمات کسب‌وکار (داشبورد فروشنده)
// ============================================
exports.updateBusiness = async (req, res) => {
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

    const {
      name,
      description,
      phone,
      address,
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
    if (phone !== undefined) data.phone = phone;
    if (address !== undefined) data.address = address;
    if (shipping_cost !== undefined) data.shipping_cost = Number(shipping_cost) || 0;
    if (delivery_enabled !== undefined) data.delivery_enabled = delivery_enabled === true || delivery_enabled === 'true';
    if (pickup_enabled !== undefined) data.pickup_enabled = pickup_enabled === true || pickup_enabled === 'true';
    if (card_number !== undefined) data.card_number = card_number;
    if (sheba_number !== undefined) data.sheba_number = sheba_number;
    if (notif_order !== undefined) data.notif_order = notif_order === true || notif_order === 'true';
    if (notif_message !== undefined) data.notif_message = notif_message === true || notif_message === 'true';
    if (notif_review !== undefined) data.notif_review = notif_review === true || notif_review === 'true';

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
    console.error('UPDATE BUSINESS ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// دریافت تنظیمات یک کسب‌وکار برای داشبورد
exports.getBusinessSettings = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);
    const userId = req.user.id;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        category: true,
        images: { where: { is_primary: true }, take: 1 },
      },
    });

    if (!business) {
      return res.status(404).json({ success: false, message: 'کسب‌وکار پیدا نشد' });
    }
    if (business.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'دسترسی غیرمجاز' });
    }

    res.json({
      success: true,
      data: business,
    });
  } catch (error) {
    console.error('GET BUSINESS SETTINGS ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// ============================================
// گزارشات رشد داشبورد فروشنده
// ============================================
exports.getDashboardReports = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);

    // چک دسترسی بر اساس اشتراک
    const plan = await getActivePlan(businessId);
    const allowViewStats = plan?.view_stats === true;
    const allowClickStats = plan?.click_stats === true;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        views: true,
        call_count: true,
        route_count: true,
        created_at: true,
      },
    });

    if (!business) {
      return res.status(404).json({ success: false, message: 'کسب‌وکار پیدا نشد' });
    }

    const productsCount = await prisma.product.count({ where: { business_id: businessId } });
    const activeProducts = await prisma.product.count({ where: { business_id: businessId, active: true } });

    const reviews = await prisma.review.findMany({
      where: { business_id: businessId },
      select: { rating: true },
    });

    const reviewsCount = reviews.length;
    const avgRating = reviewsCount > 0
      ? Number((reviews.reduce((s, r) => s + r.rating, 0) / reviewsCount).toFixed(1))
      : 0;

    const visibilityScore = Math.min(
      100,
      Math.round(
        (business.views || 0) * 0.1 +
          (business.call_count || 0) * 2 +
          (business.route_count || 0) * 3 +
          activeProducts * 5 +
          avgRating * 8
      )
    );

    res.json({
      success: true,
      data: {
        // آمار بازدید
        monthlyViews: allowViewStats ? (business.views || 0) : null,
        profileViews: allowViewStats ? (business.views || 0) : null,
        visibilityScore: allowViewStats ? visibilityScore : null,

        // آمار کلیک
        productClicks: allowClickStats ? (business.call_count || 0) : null,
        callCount: allowClickStats ? (business.call_count || 0) : null,
        routeCount: allowClickStats ? (business.route_count || 0) : null,

        // آمار عمومی
        productsCount,
        activeProducts,
        reviewsCount,
        avgRating,

        // اطلاعات پلن فعلی
        plan: {
          key: plan?.key || 'basic',
          name: plan?.name || 'استارک پایه',
          view_stats: allowViewStats,
          click_stats: allowClickStats,
          max_images: plan?.max_images ?? 20,
        },
      },
    });
  } catch (error) {
    console.error('Dashboard Reports Error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// ============================================
// سرچ پیشرفته کسب‌وکارها (صفحه سرچ)
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
        { name: { contains: q.trim(), mode: 'insensitive' } },
        { description: { contains: q.trim(), mode: 'insensitive' } },
        { address: { contains: q.trim(), mode: 'insensitive' } },
      ];
    }

    if (category && category !== 'all') {
      const cat = await prisma.category.findUnique({
        where: { key_name: category },
      });
      if (cat) {
        where.category_id = cat.id;
      }
    }

    let businesses = await prisma.business.findMany({
      where,
      include: {
        category: true,
        images: {
          where: { is_primary: true },
          take: 1,
        },
        reviews: {
          select: { rating: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    businesses = businesses.map((b) => {
      const reviewsCount = b.reviews.length;
      const avgRating =
        reviewsCount > 0
          ? Number(
              (b.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount).toFixed(1)
            )
          : 0;

      // محاسبه باز بودن
      let isOpen = false;
      if (b.opening_time && b.closing_time) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const open = new Date(b.opening_time);
        const close = new Date(b.closing_time);
        const openMinutes = open.getHours() * 60 + open.getMinutes();
        const closeMinutes = close.getHours() * 60 + close.getMinutes();

        if (closeMinutes > openMinutes) {
          isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
        } else {
          isOpen = currentMinutes >= openMinutes || currentMinutes < closeMinutes;
        }
      }

      // محاسبه فاصله با Haversine
      let distance = null;
      if (lat && lng && b.latitude && b.longitude) {
        const R = 6371;
        const dLat = ((Number(b.latitude) - Number(lat)) * Math.PI) / 180;
        const dLon = ((Number(b.longitude) - Number(lng)) * Math.PI) / 180;
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

    // فیلتر امتیاز
    if (Number(minRate) > 0) {
      businesses = businesses.filter((b) => b.avgRating >= Number(minRate));
    }

    // فیلتر فقط بازها
    if (openOnly === 'true') {
      businesses = businesses.filter((b) => b.isOpen);
    }

    // فیلتر فاصله
    if (Number(maxDist) < 99 && lat && lng) {
      businesses = businesses.filter(
        (b) => b.distance !== null && b.distance <= Number(maxDist)
      );
    }

    // مرتب‌سازی
    if (sort === 'rating') {
      businesses.sort((a, b) => b.avgRating - a.avgRating || b.reviewsCount - a.reviewsCount);
    } else if (sort === 'dist' && lat && lng) {
      businesses.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
    } else if (sort === 'new') {
      businesses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    const start = (Number(page) - 1) * Number(limit);
    const paginated = businesses.slice(start, start + Number(limit));

    res.json({
      success: true,
      total: businesses.length,
      data: paginated,
    });
  } catch (error) {
    console.error('SEARCH BUSINESSES ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};