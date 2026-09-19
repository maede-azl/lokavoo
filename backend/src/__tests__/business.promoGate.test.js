// تست‌های واحد برای گیت «فقط اشتراک رشد به بالا اجازه‌ی خرید تبلیغ داره»
// این قفل تجاری مهمیه؛ نباید کسی بدون اشتراک مناسب بتونه تبلیغ بخره،
// و نشان تایید‌شده باید همیشه (بدون نیاز به اشتراک) قابل خرید بمونه.

jest.mock('../config/db', () => ({
  business: { findUnique: jest.fn() },
  promo: { create: jest.fn() },
  businessSubscription: { findFirst: jest.fn() },
  subscriptionPlan: { findFirst: jest.fn() },
}));

const prisma = require('../config/db');
const businessController = require('../controllers/business.controller');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('business.requestPromo — گیت اشتراک برای تبلیغات', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.business.findUnique.mockResolvedValue({ user_id: 1 });
  });

  test('بدون اشتراک فعال (پلن رایگان)، خرید تبلیغ واقعی رد می‌شود', async () => {
    prisma.businessSubscription.findFirst.mockResolvedValue(null);
    prisma.subscriptionPlan.findFirst.mockResolvedValue({ can_advertise: false, key: 'free' });

    const req = { params: { businessId: '1' }, body: { type: 'home_featured' }, user: { id: 1 } };
    const res = mockRes();

    await businessController.requestPromo(req, res);

    expect(prisma.promo.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('با اشتراک «رشد» فعال، خرید تبلیغ مجاز است', async () => {
    prisma.businessSubscription.findFirst.mockResolvedValue({
      plan: { can_advertise: true, key: 'growth' },
    });
    prisma.promo.create.mockResolvedValue({ id: 1, type: 'نمایش در صفحه اصلی' });

    const req = { params: { businessId: '1' }, body: { type: 'home_featured' }, user: { id: 1 } };
    const res = mockRes();

    await businessController.requestPromo(req, res);

    expect(prisma.promo.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('نشان تایید‌شده حتی بدون اشتراک هم قابل خرید است', async () => {
    prisma.businessSubscription.findFirst.mockResolvedValue(null);
    prisma.subscriptionPlan.findFirst.mockResolvedValue({ can_advertise: false, key: 'free' });
    prisma.promo.create.mockResolvedValue({ id: 2, type: 'نشان کسب‌وکار تایید‌شده' });

    const req = { params: { businessId: '1' }, body: { type: 'verified_badge' }, user: { id: 1 } };
    const res = mockRes();

    await businessController.requestPromo(req, res);

    expect(prisma.promo.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
