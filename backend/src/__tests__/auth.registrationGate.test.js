// تست‌های واحد برای «بستن ثبت‌نام» — تنظیمی که ادمین از پنل خودش کنترل می‌کند.
// این تست مطمئن می‌شود که وقتی ادمین ثبت‌نام را می‌بندد، سمت سرور هم واقعاً
// جلوی ساخت حساب جدید گرفته می‌شود (نه فقط ظاهر فرانت مخفی بشه).

process.env.JWT_SECRET = 'test-secret';

jest.mock('../config/db', () => ({
  siteSetting: { findUnique: jest.fn() },
  user: { findUnique: jest.fn(), create: jest.fn() },
}));

const prisma = require('../config/db');
const authController = require('../controllers/auth.controller');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('auth.completeSignup — گیت ثبت‌نام', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('وقتی registration_open برابر false است، ثبت‌نام جدید رد می‌شود', async () => {
    prisma.siteSetting.findUnique.mockResolvedValue({ registration_open: false });

    const req = { body: { phone: '09120000000', name: 'تست' } };
    const res = mockRes();

    await authController.completeSignup(req, res);

    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('وقتی registration_open برابر true است، ثبت‌نام عادی ادامه پیدا می‌کند', async () => {
    prisma.siteSetting.findUnique.mockResolvedValue({ registration_open: true });
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 1,
      name: 'تست',
      phone: '09120000000',
      role: 'user',
    });

    const req = { body: { phone: '09120000000', name: 'تست' } };
    const res = mockRes();

    await authController.completeSignup(req, res);

    expect(prisma.user.create).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  test('اگر هنوز هیچ ردیف تنظیماتی در دیتابیس ساخته نشده باشد، پیش‌فرض باز بودن ثبت‌نام است (رفتار قبلی حفظ می‌شود)', async () => {
    prisma.siteSetting.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 2, phone: '09120000001', role: 'user' });

    const req = { body: { phone: '09120000001', name: 'تست دو' } };
    const res = mockRes();

    await authController.completeSignup(req, res);

    expect(prisma.user.create).toHaveBeenCalled();
  });

  test('شماره‌ی تکراری را حتی وقتی ثبت‌نام باز است رد می‌کند', async () => {
    prisma.siteSetting.findUnique.mockResolvedValue({ registration_open: true });
    prisma.user.findUnique.mockResolvedValue({ id: 99, phone: '09120000000' });

    const req = { body: { phone: '09120000000', name: 'تست' } };
    const res = mockRes();

    await authController.completeSignup(req, res);

    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
  });
});
