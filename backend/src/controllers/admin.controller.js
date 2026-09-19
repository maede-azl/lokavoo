const prisma = require('../config/db');

// ============================================
// آمار کلی داشبورد ادمین
// ============================================

exports.getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalBusinesses,
      pendingBusinesses,
      totalProducts,
      totalReviews,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.business.count(),
      prisma.business.count({ where: { status: 'pending' } }),
      prisma.product.count(),
      prisma.review.count(),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalBusinesses,
        pendingBusinesses,
        totalProducts,
        totalReviews,
      },
    });
  } catch (error) {
    console.error('ADMIN GET STATS ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// ============================================
// کاربران
// ============================================

exports.getUsers = async (req, res) => {
  try {
    const { q, status } = req.query;
    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (q) {
      where.OR = [
        {
          name: {
            contains: q,
            mode: 'insensitive',
          },
        },
        {
          phone: {
            contains: q,
          },
        },
        {
          email: {
            contains: q,
            mode: 'insensitive',
          },
        },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('ADMIN GET USERS ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const { status } = req.body;

    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'وضعیت نامعتبر است',
      });
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        status,
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('ADMIN UPDATE USER STATUS ERROR:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'کاربر پیدا نشد',
      });
    }

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const { role } = req.body;

    if (!['user', 'seller', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'نقش نامعتبر است',
      });
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        role,
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('ADMIN UPDATE USER ROLE ERROR:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'کاربر پیدا نشد',
      });
    }

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    res.json({
      success: true,
      message: 'کاربر حذف شد',
    });
  } catch (error) {
    console.error('ADMIN DELETE USER ERROR:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'کاربر پیدا نشد',
      });
    }

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

// ============================================
// کسب‌وکارها (فروشندگان) — تایید / رد / تعلیق
// ============================================

exports.getBusinesses = async (req, res) => {
  try {
    const { q, status, category_id } = req.query;
    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (category_id) {
      where.category_id = Number(category_id);
    }

    if (q) {
      where.OR = [
        {
          name: {
            contains: q,
            mode: 'insensitive',
          },
        },
        {
          address: {
            contains: q,
            mode: 'insensitive',
          },
        },
      ];
    }

    const businesses = await prisma.business.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            key_name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        images: {
          select: {
            id: true,
            image_url: true,
            is_primary: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: businesses,
    });
  } catch (error) {
    console.error('ADMIN GET BUSINESSES ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

exports.updateBusinessStatus = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);
    const { status } = req.body;

    if (!['pending', 'approved', 'suspended', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'وضعیت نامعتبر است',
      });
    }

    const business = await prisma.business.update({
      where: {
        id: businessId,
      },
      data: {
        status,
      },
    });

    res.json({
      success: true,
      data: business,
    });
  } catch (error) {
    console.error('ADMIN UPDATE BUSINESS STATUS ERROR:', error);

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

exports.deleteBusinessAdmin = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);

    await prisma.business.delete({
      where: {
        id: businessId,
      },
    });

    res.json({
      success: true,
      message: 'کسب‌وکار حذف شد',
    });
  } catch (error) {
    console.error('ADMIN DELETE BUSINESS ERROR:', error);

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

exports.toggleBusinessBanner = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);

    const existing = await prisma.business.findUnique({
      where: {
        id: businessId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'کسب‌وکار پیدا نشد',
      });
    }

    const business = await prisma.business.update({
      where: {
        id: businessId,
      },
      data: {
        has_banner_access: !existing.has_banner_access,
      },
    });

    res.json({
      success: true,
      data: business,
    });
  } catch (error) {
    console.error('ADMIN TOGGLE BANNER ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

// ============================================
// دسته‌بندی‌ها — CRUD کامل برای ادمین
// ============================================

function slugifyCategoryName(name) {
  const base = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

  return base || 'category';
}

async function generateUniqueKeyName(name) {
  const base = slugifyCategoryName(name);

  let candidate = base;
  let suffix = 2;

  for (let i = 0; i < 20; i++) {
    const existing = await prisma.category.findUnique({
      where: {
        key_name: candidate,
      },
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return `${base}-${Date.now()}`;
}

exports.createCategory = async (req, res) => {
  try {
    const {
      name,
      icon,
      color_1,
      color_2,
    } = req.body;

    let { key_name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'نام دسته‌بندی الزامی است',
      });
    }

    key_name =
      key_name && key_name.trim()
        ? key_name.trim()
        : await generateUniqueKeyName(name);

    const category = await prisma.category.create({
      data: {
        name,
        key_name,
        icon,
        color_1,
        color_2,
      },
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('ADMIN CREATE CATEGORY ERROR:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'این شناسه دسته‌بندی قبلاً استفاده شده',
      });
    }

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const categoryId = Number(req.params.categoryId);

    const {
      name,
      icon,
      color_1,
      color_2,
    } = req.body;

    const data = {};

    if (name !== undefined) {
      data.name = name;
    }

    if (icon !== undefined) {
      data.icon = icon;
    }

    if (color_1 !== undefined) {
      data.color_1 = color_1;
    }

    if (color_2 !== undefined) {
      data.color_2 = color_2;
    }

    const category = await prisma.category.update({
      where: {
        id: categoryId,
      },
      data,
    });

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('ADMIN UPDATE CATEGORY ERROR:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'دسته‌بندی پیدا نشد',
      });
    }

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = Number(req.params.categoryId);

    const inUse = await prisma.business.count({
      where: {
        category_id: categoryId,
      },
    });

    if (inUse > 0) {
      return res.status(409).json({
        success: false,
        message: 'این دسته‌بندی توسط چند کسب‌وکار استفاده می‌شود و قابل حذف نیست',
      });
    }

    await prisma.category.delete({
      where: {
        id: categoryId,
      },
    });

    res.json({
      success: true,
      message: 'دسته‌بندی حذف شد',
    });
  } catch (error) {
    console.error('ADMIN DELETE CATEGORY ERROR:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'دسته‌بندی پیدا نشد',
      });
    }

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

// ============================================
// محصولات
// ============================================

exports.getProducts = async (req, res) => {
  try {
    const {
      q,
      status,
      business_id,
      category_id,
    } = req.query;

    const where = {};

    // Product در فرانت با active مدیریت می‌شود؛
    // status را فقط در صورتی اعمال می‌کنیم که بک‌اند واقعاً آن فیلد را داشته باشد.
    // برای جلوگیری از فیلتر اشتباه، فیلتر status در این endpoint اعمال نمی‌شود.

    if (business_id) {
      where.business_id = Number(business_id);
    }

    if (category_id) {
      where.category_id = Number(category_id);
    }

    if (q) {
      where.OR = [
        {
          name: {
            contains: q,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: q,
            mode: 'insensitive',
          },
        },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            key_name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('ADMIN GET PRODUCTS ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

exports.updateProductStatus = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const { status } = req.body;

    if (!['active', 'hidden', 'review', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'وضعیت محصول نامعتبر است',
      });
    }

    const active = status === 'active';

    const product = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        active,
      },
    });

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('ADMIN UPDATE PRODUCT STATUS ERROR:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'محصول پیدا نشد',
      });
    }

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

exports.updateProductActive = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const { active } = req.body;

    if (!Number.isInteger(productId)) {
      return res.status(400).json({
        success: false,
        message: 'شناسه محصول نامعتبر است',
      });
    }

    if (typeof active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'مقدار active نامعتبر است',
      });
    }

    const product = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        active,
      },
    });

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('ADMIN UPDATE PRODUCT ACTIVE ERROR:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'محصول پیدا نشد',
      });
    }

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const productId = Number(req.params.productId);

    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    res.json({
      success: true,
      message: 'محصول حذف شد',
    });
  } catch (error) {
    console.error('ADMIN DELETE PRODUCT ERROR:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'محصول پیدا نشد',
      });
    }

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

exports.deleteProductAdmin = async (req, res) => {
  return exports.deleteProduct(req, res);
};

// ============================================
// تبلیغات / پروموشن‌ها
// ============================================

exports.getPromos = async (req, res) => {
  try {
    const {
      status,
      type,
      business_id,
    } = req.query;

    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    if (business_id) {
      where.business_id = Number(business_id);
    }

    const promos = await prisma.promo.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: promos,
    });
  } catch (error) {
    console.error('ADMIN GET PROMOS ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

exports.updatePromoStatus = async (req, res) => {
  try {
    const promoId = Number(req.params.promoId);
    const { status } = req.body;

    if (!['pending', 'active', 'inactive', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'وضعیت تبلیغ نامعتبر است',
      });
    }

    const promo = await prisma.promo.update({
      where: {
        id: promoId,
      },
      data: {
        status,
      },
    });

    res.json({
      success: true,
      data: promo,
    });
  } catch (error) {
    console.error('ADMIN UPDATE PROMO STATUS ERROR:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'تبلیغ پیدا نشد',
      });
    }

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

exports.togglePromoVisible = async (req, res) => {
  try {
    const promoId = Number(req.params.promoId);

    if (!Number.isInteger(promoId)) {
      return res.status(400).json({
        success: false,
        message: 'شناسه تبلیغ نامعتبر است',
      });
    }

    const existing = await prisma.promo.findUnique({
      where: {
        id: promoId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'تبلیغ پیدا نشد',
      });
    }

    const promo = await prisma.promo.update({
      where: {
        id: promoId,
      },
      data: {
        visible: !existing.visible,
      },
    });

    res.json({
      success: true,
      data: promo,
    });
  } catch (error) {
    console.error('ADMIN TOGGLE PROMO VISIBLE ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

exports.deletePromo = async (req, res) => {
  try {
    const promoId = Number(req.params.promoId);

    await prisma.promo.delete({
      where: {
        id: promoId,
      },
    });

    res.json({
      success: true,
      message: 'تبلیغ حذف شد',
    });
  } catch (error) {
    console.error('ADMIN DELETE PROMO ERROR:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'تبلیغ پیدا نشد',
      });
    }

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

// ============================================
// آمار کلیک‌ها
// ============================================

exports.getClicks = async (req, res) => {
  try {
    const clicks = await prisma.businessClick.findMany({
      orderBy: {
        created_at: 'desc',
      },
      take: 500,
      include: {
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: clicks,
    });
  } catch (error) {
    console.error('ADMIN GET CLICKS ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

exports.getClicksOverview = async (req, res) => {
  try {
    // BusinessDetailPage مستقیماً call_count / route_count را روی خود business افزایش می‌دهد؛
    // پنل ادمین نیز باید همان منبع داده را بخواند تا با پنل فروشنده یکسان باشد.
    const businesses = await prisma.business.findMany({
      orderBy: {
        updated_at: 'desc',
      },
      take: 500,
      select: {
        id: true,
        name: true,
        call_count: true,
        route_count: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    const rows = businesses.map((business) => ({
      id: business.id,
      name: business.name,
      category: business.category?.name || '—',
      call_count: Number(business.call_count || 0),
      route_count: Number(business.route_count || 0),
      total_count:
        Number(business.call_count || 0) +
        Number(business.route_count || 0),
    }));

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('ADMIN GET CLICKS OVERVIEW ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

// ============================================
// گفتگوهای پشتیبانی
// ============================================

exports.startOrGetThread = async (req, res) => {
  try {
    const userId = Number(
      req.body.userId ?? req.body.user_id
    );

    const { text } = req.body;

    if (!Number.isInteger(userId)) {
      return res.status(400).json({
        success: false,
        message: 'شناسه کاربر نامعتبر است',
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'کاربر پیدا نشد',
      });
    }

    let thread = await prisma.adminThread.findUnique({
      where: {
        user_id: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
        messages: {
          orderBy: {
            created_at: 'asc',
          },
        },
      },
    });

    if (!thread) {
      thread = await prisma.adminThread.create({
        data: {
          user_id: userId,
          unread: 0,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              role: true,
            },
          },
          messages: {
            orderBy: {
              created_at: 'asc',
            },
          },
        },
      });
    }

    if (text && text.trim()) {
      const message = await prisma.adminMessage.create({
        data: {
          thread_id: thread.id,
          sender: 'admin',
          text: text.trim(),
        },
      });

      await prisma.adminThread.update({
        where: {
          id: thread.id,
        },
        data: {
          updated_at: new Date(),
        },
      });

      thread = {
        ...thread,
        messages: [
          ...thread.messages,
          message,
        ],
      };
    }

    res.json({
      success: true,
      data: thread,
    });
  } catch (error) {
    console.error('ADMIN START OR GET THREAD ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

exports.getThreads = async (req, res) => {
  try {
    const threads = await prisma.adminThread.findMany({
      orderBy: {
        updated_at: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
        messages: {
          orderBy: {
            created_at: 'asc',
          },
        },
      },
    });

    res.json({
      success: true,
      data: threads,
    });
  } catch (error) {
    console.error('ADMIN GET THREADS ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

exports.markThreadRead = async (req, res) => {
  try {
    const threadId = Number(req.params.threadId);

    const thread = await prisma.adminThread.update({
      where: {
        id: threadId,
      },
      data: {
        unread: 0,
      },
    });

    res.json({
      success: true,
      data: thread,
    });
  } catch (error) {
    console.error('ADMIN MARK THREAD READ ERROR:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'گفتگو پیدا نشد',
      });
    }

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

exports.sendAdminMessage = async (req, res) => {
  try {
    const threadId = Number(req.params.threadId);
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'متن پیام خالی است',
      });
    }

    const thread = await prisma.adminThread.findUnique({
      where: {
        id: threadId,
      },
    });

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'گفتگو پیدا نشد',
      });
    }

    const message = await prisma.adminMessage.create({
      data: {
        thread_id: threadId,
        sender: 'admin',
        text: text.trim(),
      },
    });

    await prisma.adminThread.update({
      where: {
        id: threadId,
      },
      data: {
        updated_at: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('ADMIN SEND MESSAGE ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

// ============================================
// گزارش‌های مشکل کاربران
// ============================================

exports.getReports = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    const reports = await prisma.problemReport.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error('ADMIN GET REPORTS ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

exports.replyToReport = async (req, res) => {
  try {
    const reportId = Number(req.params.reportId);
    const {
      reply,
      admin_reply,
      status,
    } = req.body;

    const replyText =
      admin_reply !== undefined
        ? admin_reply
        : reply !== undefined
          ? reply
          : undefined;

    if (!Number.isInteger(reportId)) {
      return res.status(400).json({
        success: false,
        message: 'شناسه گزارش نامعتبر است',
      });
    }

    const data = {};

    if (replyText !== undefined) {
      data.admin_reply = String(replyText);
      data.replied_at = new Date();
    }

    if (status !== undefined) {
      data.status = status;
    } else if (
      replyText &&
      String(replyText).trim()
    ) {
      data.status = 'resolved';
    }

    const report = await prisma.problemReport.update({
      where: {
        id: reportId,
      },
      data,
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('ADMIN REPLY REPORT ERROR:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'گزارش پیدا نشد',
      });
    }

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

// ============================================
// تنظیمات سایت
// ============================================

exports.getSettings = async (req, res) => {
  try {
    let settings = await prisma.siteSetting.findUnique({
      where: {
        id: 1,
      },
    });

    if (!settings) {
      settings = await prisma.siteSetting.create({
        data: {
          id: 1,
        },
      });
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('ADMIN GET SETTINGS ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const {
      site_name,
      registration_open,
      auto_approve,
      maintenance_mode,
      banner_image_url,
    } = req.body;

    const data = {};

    if (site_name !== undefined) {
      data.site_name = site_name;
    }

    if (registration_open !== undefined) {
      data.registration_open = !!registration_open;
    }

    if (auto_approve !== undefined) {
      data.auto_approve = !!auto_approve;
    }

    if (maintenance_mode !== undefined) {
      data.maintenance_mode = !!maintenance_mode;
    }

    if (banner_image_url !== undefined) {
      data.banner_image_url = banner_image_url;
    }

    const settings = await prisma.siteSetting.upsert({
      where: {
        id: 1,
      },
      update: data,
      create: {
        id: 1,
        ...data,
      },
    });

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('ADMIN UPDATE SETTINGS ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

// ============================================
// محتوای فوتر سایت
// ============================================

exports.getFooter = async (req, res) => {
  try {
    let footer = await prisma.footerContent.findUnique({
      where: {
        id: 1,
      },
    });

    if (!footer) {
      footer = await prisma.footerContent.create({
        data: {
          id: 1,
          data: {
            brand: {
              description: '',
              social: {
                instagram: '',
                telegram: '',
                x: '',
              },
            },
            pages: {
              about: {
                title: 'درباره ما',
                body: '',
              },
              contact: {
                title: 'تماس با ما',
                body: '',
              },
              guide: {
                title: 'راهنمای استفاده',
                body: '',
              },
              faq: {
                title: 'سوالات متداول',
                body: '',
              },
              terms: {
                title: 'قوانین و مقررات',
                body: '',
              },
              pricing: {
                title: 'تعرفه‌ها',
                body: '',
              },
              'seller-guide': {
                title: 'راهنمای فروشندگان',
                body: '',
              },
            },
            bottomMade: '',
          },
        },
      });
    }

    res.json({
      success: true,
      data: footer.data,
    });
  } catch (error) {
    console.error('ADMIN GET FOOTER ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

exports.updateFooter = async (req, res) => {
  try {
    const footerData = req.body;

    const footer = await prisma.footerContent.upsert({
      where: {
        id: 1,
      },
      update: {
        data: footerData,
      },
      create: {
        id: 1,
        data: footerData,
      },
    });

    res.json({
      success: true,
      data: footer.data,
    });
  } catch (error) {
    console.error('ADMIN UPDATE FOOTER ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'خطای سرور',
    });
  }
};

// ============================================
// درآمد سایت (اشتراک‌ها + تبلیغات)
// ============================================

exports.getRevenue = async (req, res) => {
  try {
    const now = new Date();

    const startOfThisMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const [
      successfulPayments,
      activeSubscriptions,
      promos,
    ] = await Promise.all([
      prisma.payment.findMany({
        where: {
          status: 'success',
        },
        orderBy: {
          created_at: 'desc',
        },
      }),

      prisma.businessSubscription.findMany({
        where: {
          status: 'active',
          plan: {
            key: {
              not: 'free',
            },
          },
        },
        include: {
          plan: true,
          business: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      }),

      prisma.promo.findMany({
        where: {
          status: 'active',
        },
        include: {
          business: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
    ]);

    const activeSubs = activeSubscriptions.filter((s) => {
      return (
        !s.expires_at ||
        new Date(s.expires_at) > now
      );
    });

    const mrr = activeSubs.reduce((sum, s) => {
      const price = Number(s.plan?.price || 0);

      const monthlyValue =
        s.plan?.billing_cycle === 'yearly'
          ? Math.round(price / 12)
          : price;

      return sum + monthlyValue;
    }, 0);

    const paymentsThisMonth =
      successfulPayments.filter((p) => {
        return (
          new Date(p.created_at) >=
          startOfThisMonth
        );
      });

    const paidRevenueThisMonth =
      paymentsThisMonth.reduce(
        (sum, p) =>
          sum + Number(p.amount || 0),
        0
      );

    const totalPaidRevenue =
      successfulPayments.reduce(
        (sum, p) =>
          sum + Number(p.amount || 0),
        0
      );

    const promoRevenueThisMonth =
      promos
        .filter((p) => {
          return (
            new Date(p.created_at) >=
            startOfThisMonth
          );
        })
        .reduce(
          (sum, p) =>
            sum + Number(p.price || 0),
          0
        );

    const promoRevenueTotal =
      promos.reduce(
        (sum, p) =>
          sum + Number(p.price || 0),
        0
      );

    const revenueThisMonth =
      paidRevenueThisMonth +
      promoRevenueThisMonth;

    const totalRevenue =
      totalPaidRevenue +
      promoRevenueTotal;

    const monthlyTrend = [];

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

      const monthEnd = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        1
      );

      const paymentsInMonth =
        successfulPayments.filter((p) => {
          const d = new Date(p.created_at);
          return (
            d >= monthStart &&
            d < monthEnd
          );
        });

      const promosInMonth =
        promos.filter((p) => {
          const d = new Date(p.created_at);
          return (
            d >= monthStart &&
            d < monthEnd
          );
        });

      monthlyTrend.push({
        month:
          monthStart.toLocaleDateString(
            'fa-IR',
            {
              month: 'long',
            }
          ),

        subscriptions:
          paymentsInMonth
            .filter(
              (p) =>
                p.purpose ===
                'subscription'
            )
            .reduce(
              (sum, p) =>
                sum +
                Number(
                  p.amount || 0
                ),
              0
            ),

        promos:
          promosInMonth.reduce(
            (sum, p) =>
              sum +
              Number(
                p.price || 0
              ),
            0
          ),
      });
    }

    const byPlan = {};

    activeSubs.forEach((s) => {
      const key =
        s.plan?.name || 'نامشخص';

      byPlan[key] =
        (byPlan[key] || 0) + 1;
    });

    const recentTransactions = [
      ...successfulPayments
        .slice(0, 15)
        .map((p) => ({
          type:
            p.purpose === 'promo'
              ? 'promo'
              : 'subscription',

          business: null,

          label:
            p.purpose ===
            'subscription'
              ? 'پرداخت اشتراک'
              : p.promo_type ||
                'تبلیغ',

          amount: Number(
            p.amount || 0
          ),

          status: p.status,

          date: p.created_at,
        })),

      ...promos
        .slice(0, 15)
        .map((p) => ({
          type: 'promo',

          business:
            p.business?.name ||
            null,

          label: p.type,

          amount: Number(
            p.price || 0
          ),

          status: p.status,

          date: p.created_at,
        })),
    ]
      .sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      )
      .slice(0, 15);

    return res.json({
      success: true,
      data: {
        mrr,
        revenueThisMonth,
        totalRevenue,
        activeSubscriptionsCount:
          activeSubs.length,

        pendingPromosCount:
          promos.filter(
            (p) =>
              p.status ===
              'pending'
          ).length,

        byPlan,
        monthlyTrend,
        recentTransactions,
      },
    });
  } catch (error) {
    console.error(
      'ADMIN GET REVENUE ERROR:',
      {
        name: error?.name,
        code: error?.code,
        message:
          error?.message,
        meta: error?.meta,
        stack: error?.stack,
      }
    );

    return res.status(500).json({
      success: false,
      message: 'خطای سرور',
      code:
        error?.code ||
        'ADMIN_REVENUE_ERROR',

      ...(process.env.NODE_ENV !==
      'production'
        ? {
            debug:
              error?.message ||
              String(error),
          }
        : {}),
    });
  }
};