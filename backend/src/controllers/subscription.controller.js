const prisma = require('../config/db');

// گرفتن لیست همه پلن‌های فعال
exports.getPlans = async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { is_active: true },
      orderBy: [{ key: 'asc' }, { billing_cycle: 'asc' }],
    });

    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('getPlans error:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت پلن‌ها' });
  }
};

// گرفتن اشتراک فعلی یک کسب‌وکار
exports.getMySubscription = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);

    if (!businessId) {
      return res.status(400).json({ success: false, message: 'businessId الزامی است' });
    }

    // اشتراک فعال
    let subscription = await prisma.businessSubscription.findFirst({
      where: {
        business_id: businessId,
        status: 'active',
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } },
        ],
      },
      include: { plan: true },
      orderBy: { created_at: 'desc' },
    });

    // اگر اشتراک فعال نداشت → پلن پایه رو برگردون
    if (!subscription) {
      const basicPlan = await prisma.subscriptionPlan.findFirst({
        where: { key: 'basic', billing_cycle: 'monthly' },
      });

      return res.json({
        success: true,
        data: {
          is_default: true,
          plan: basicPlan,
          status: 'active',
          starts_at: null,
          expires_at: null,
        },
      });
    }

    res.json({ success: true, data: subscription });
  } catch (error) {
    console.error('getMySubscription error:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت اشتراک' });
  }
};

// خرید / فعال‌سازی اشتراک (فعلاً بدون درگاه واقعی)
exports.subscribe = async (req, res) => {
  try {
    const { businessId, planId } = req.body;
    const userId = req.user.id; // از middleware احراز هویت

    if (!businessId || !planId) {
      return res.status(400).json({ success: false, message: 'businessId و planId الزامی هستند' });
    }

    // چک کردن مالکیت کسب‌وکار
    const business = await prisma.business.findFirst({
      where: { id: Number(businessId), user_id: userId },
    });

    if (!business) {
      return res.status(403).json({ success: false, message: 'شما مالک این کسب‌وکار نیستید' });
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: Number(planId) },
    });

    if (!plan || !plan.is_active) {
      return res.status(404).json({ success: false, message: 'پلن پیدا نشد' });
    }

    // منقضی کردن اشتراک‌های قبلی فعال
    await prisma.businessSubscription.updateMany({
      where: {
        business_id: Number(businessId),
        status: 'active',
      },
      data: { status: 'expired' },
    });

    const startsAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

    const subscription = await prisma.businessSubscription.create({
      data: {
        business_id: Number(businessId),
        plan_id: plan.id,
        status: 'active',
        starts_at: startsAt,
        expires_at: expiresAt,
        payment_ref: `MOCK-${Date.now()}`, // موقتی تا درگاه واقعی وصل بشه
      },
      include: { plan: true },
    });

    res.json({
      success: true,
      message: 'اشتراک با موفقیت فعال شد',
      data: subscription,
    });
  } catch (error) {
    console.error('subscribe error:', error);
    res.status(500).json({ success: false, message: 'خطا در فعال‌سازی اشتراک' });
  }
};