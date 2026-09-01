const prisma = require('../config/db');

/**
 * پلن فعال یک کسب‌وکار را برمی‌گرداند.
 * اگر اشتراک فعالی نداشت → پلن پایه (basic)
 */
async function getActivePlan(businessId) {
  if (!businessId) return null;

  // اشتراک فعال و منقضی‌نشده
  const subscription = await prisma.businessSubscription.findFirst({
    where: {
      business_id: Number(businessId),
      status: 'active',
      OR: [
        { expires_at: null },
        { expires_at: { gt: new Date() } },
      ],
    },
    include: { plan: true },
    orderBy: { created_at: 'desc' },
  });

  if (subscription?.plan) {
    return subscription.plan;
  }

  // پیش‌فرض: پلن پایه ماهانه
  const basicPlan = await prisma.subscriptionPlan.findFirst({
    where: { key: 'basic', billing_cycle: 'monthly' },
  });

  return basicPlan;
}

/**
 * چک می‌کند آیا کسب‌وکار می‌تواند تصویر بیشتری برای محصولات آپلود کند یا نه
 * (فقط عکس‌های محصولات شمرده می‌شود — عکس‌های کسب‌وکار جدا هستند)
 */
async function canUploadMoreImages(businessId, additionalImages = 1) {
  const plan = await getActivePlan(businessId);
  if (!plan) return false;

  // فقط تعداد محصولاتی که عکس دارند
  const productImagesCount = await prisma.product.count({
    where: {
      business_id: Number(businessId),
      image_url: { not: null },
    },
  });

  return productImagesCount + additionalImages <= plan.max_images;
}

/**
 * چک می‌کند آیا کسب‌وکار به آمار دسترسی دارد یا نه
 */
async function canViewStats(businessId) {
  const plan = await getActivePlan(businessId);
  return plan?.view_stats === true;
}

/**
 * چک می‌کند آیا کسب‌وکار به آمار کلیک دسترسی دارد یا نه
 */
async function canViewClickStats(businessId) {
  const plan = await getActivePlan(businessId);
  return plan?.click_stats === true;
}

module.exports = {
  getActivePlan,
  canUploadMoreImages,
  canViewStats,
  canViewClickStats,
};