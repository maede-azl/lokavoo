const prisma = require('../config/db');
const { initiatePayment, verifyAndSettlePayment } = require('../services/mellat');

// شروع پرداخت برای خرید یک پلن اشتراک
exports.initiateSubscriptionPayment = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ success: false, message: 'planId الزامی است' });
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: Number(planId) } });

    if (!plan || !plan.is_active) {
      return res.status(404).json({ success: false, message: 'پلن پیدا نشد' });
    }

    if (plan.key === 'free' || plan.price <= 0) {
      return res.status(400).json({ success: false, message: 'این پلن نیاز به پرداخت ندارد' });
    }

    const orderId = `sub-${businessId}-${Date.now()}`;

    const payment = await prisma.payment.create({
      data: {
        business_id: businessId,
        purpose: 'subscription',
        plan_id: plan.id,
        amount: plan.price,
        status: 'pending',
        order_id: orderId,
      },
    });

    const result = await initiatePayment({
      orderId,
      amountRials: plan.price * 10, // تومان ذخیره‌شده در دیتابیس → ریال برای بانک
      description: `خرید اشتراک ${plan.name} (${plan.billing_cycle === 'yearly' ? 'سالانه' : 'ماهانه'})`,
    });

    if (!result.success) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed' } });
      return res.status(502).json({ success: false, message: result.error, code: result.code });
    }

    await prisma.payment.update({ where: { id: payment.id }, data: { ref_id: result.refId } });

    res.json({ success: true, redirectUrl: result.startPayUrl });
  } catch (error) {
    console.error('INITIATE SUBSCRIPTION PAYMENT ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// بازگشت از درگاه بانک ملت — این آدرس مستقیم توسط بانک صدا زده می‌شود، نه فرانت
exports.mellatCallback = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const redirectFail = (reason) =>
    res.redirect(`${frontendUrl}/seller/dashboard?tab=growth&payment=failed&reason=${encodeURIComponent(reason || '')}`);
  const redirectSuccess = () =>
    res.redirect(`${frontendUrl}/seller/dashboard?tab=growth&payment=success`);

  try {
    const { RefId, ResCode, SaleOrderId, SaleReferenceId } = req.body;

    const payment = await prisma.payment.findUnique({ where: { order_id: SaleOrderId } });

    if (!payment) {
      return redirectFail('تراکنش پیدا نشد');
    }

    if (ResCode !== '0') {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed' } });
      return redirectFail(`پرداخت لغو یا ناموفق بود (کد ${ResCode})`);
    }

    const verifyResult = await verifyAndSettlePayment({
      orderId: SaleOrderId,
      saleOrderId: SaleOrderId,
      saleReferenceId: SaleReferenceId,
    });

    if (!verifyResult.success) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed' } });
      return redirectFail(verifyResult.error);
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'success', sale_reference_id: SaleReferenceId },
    });

    // پرداخت موفق بود → حالا رکورد واقعی رو بساز
    if (payment.purpose === 'subscription' && payment.plan_id) {
      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: payment.plan_id } });

      await prisma.businessSubscription.updateMany({
        where: { business_id: payment.business_id, status: 'active' },
        data: { status: 'expired' },
      });

      const startsAt = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

      await prisma.businessSubscription.create({
        data: {
          business_id: payment.business_id,
          plan_id: plan.id,
          status: 'active',
          starts_at: startsAt,
          expires_at: expiresAt,
          payment_ref: SaleReferenceId,
        },
      });
    }

    return redirectSuccess();
  } catch (error) {
    console.error('MELLAT CALLBACK ERROR:', error);
    return redirectFail('خطای سرور');
  }
};
