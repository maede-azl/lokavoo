const prisma = require('../config/db');

/**
 * پلن فعال یک کسب‌وکار را برمی‌گرداند.
 * اگر اشتراک فعال و منقضی‌نشده‌ای نداشت → پلن رایگان پیش‌فرض (free)
 */
async function getActivePlan(businessId) {
  if (!businessId) return null;

  const subscription = await prisma.businessSubscription.findFirst({
    where: {
      business_id: Number(businessId),
      status: 'active',
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
    },
    include: { plan: true },
    orderBy: { created_at: 'desc' },
  });

  if (subscription?.plan) {
    return subscription.plan;
  }

  const freePlan = await prisma.subscriptionPlan.findFirst({
    where: { key: 'free', billing_cycle: 'monthly' },
  });

  return freePlan;
}

// آیا این کسب‌وکار اجازه دارد تبلیغ/پروموشن بخرد؟ (فقط پلن‌های رشد به بالا)
async function canAdvertise(businessId) {
  const plan = await getActivePlan(businessId);
  return plan?.can_advertise === true;
}

// آیا به آمار بازدید دسترسی دارد؟
async function canViewStats(businessId) {
  const plan = await getActivePlan(businessId);
  return plan?.view_stats === true;
}

// آیا به آمار کلیک (پیشرفته‌تر) دسترسی دارد؟
async function canViewClickStats(businessId) {
  const plan = await getActivePlan(businessId);
  return plan?.click_stats === true;
}

// آیا می‌تواند عکس محصول بیشتری اضافه کند؟
async function canUploadMoreImages(businessId, additionalImages = 1) {
  const plan = await getActivePlan(businessId);
  if (!plan) return false;

  const productImagesCount = await prisma.product.count({
    where: { business_id: Number(businessId), image_url: { not: null } },
  });

  return productImagesCount + additionalImages <= plan.max_images;
}

module.exports = {
  getActivePlan,
  canAdvertise,
  canViewStats,
  canViewClickStats,
  canUploadMoreImages,
};
