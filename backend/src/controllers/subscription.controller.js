const prisma = require('../config/db');

// لیست همه‌ی پلن‌های فعال (عمومی)
exports.getPlans = async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { is_active: true },
      orderBy: [{ price: 'asc' }, { billing_cycle: 'asc' }],
    });

    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('GET PLANS ERROR:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت پلن‌ها' });
  }
};

// اشتراک فعلی یک کسب‌وکار (با محاسبه‌ی روز باقی‌مانده)
exports.getMySubscription = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);

    let subscription = await prisma.businessSubscription.findFirst({
      where: {
        business_id: businessId,
        status: 'active',
        OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      },
      include: { plan: true },
      orderBy: { created_at: 'desc' },
    });

    if (!subscription) {
      const freePlan = await prisma.subscriptionPlan.findFirst({
        where: { key: 'free', billing_cycle: 'monthly' },
      });

      return res.json({
        success: true,
        data: {
          is_default: true,
          plan: freePlan,
          status: 'active',
          starts_at: null,
          expires_at: null,
          days_remaining: null,
          is_expired: false,
        },
      });
    }

    const now = new Date();
    const expiresAt = subscription.expires_at ? new Date(subscription.expires_at) : null;
    let daysRemaining = null;
    let isExpired = false;

    if (expiresAt) {
      daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysRemaining <= 0) {
        daysRemaining = 0;
        isExpired = true;
      }
    }

    res.json({
      success: true,
      data: { ...subscription, days_remaining: daysRemaining, is_expired: isExpired },
    });
  } catch (error) {
    console.error('GET MY SUBSCRIPTION ERROR:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت اشتراک' });
  }
};

// خرید/فعال‌سازی اشتراک
// نکته: تا وصل شدن درگاه پرداخت واقعی، فعال‌سازی موقت با payment_ref مصنوعی
// انجام می‌شه (دقیقاً مثل نسخه‌ی قبلی) — بعد از دریافت مشخصات درگاه، این تابع
// باید قبل از ساخت رکورد اشتراک، پرداخت واقعی رو verify کنه.
exports.subscribe = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ success: false, message: 'planId الزامی است' });
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: Number(planId) },
    });

    if (!plan || !plan.is_active) {
      return res.status(404).json({ success: false, message: 'پلن پیدا نشد' });
    }

    if (plan.key === 'free') {
      return res.status(400).json({ success: false, message: 'پلن رایگان نیازی به فعال‌سازی ندارد' });
    }

    // منقضی کردن اشتراک‌های فعال قبلی
    await prisma.businessSubscription.updateMany({
      where: { business_id: businessId, status: 'active' },
      data: { status: 'expired' },
    });

    const startsAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

    const subscription = await prisma.businessSubscription.create({
      data: {
        business_id: businessId,
        plan_id: plan.id,
        status: 'active',
        starts_at: startsAt,
        expires_at: expiresAt,
        payment_ref: `PENDING-${Date.now()}`, // موقت تا وصل شدن درگاه پرداخت واقعی
      },
      include: { plan: true },
    });

    res.json({
      success: true,
      message: 'اشتراک با موفقیت فعال شد',
      data: subscription,
    });
  } catch (error) {
    console.error('SUBSCRIBE ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};
