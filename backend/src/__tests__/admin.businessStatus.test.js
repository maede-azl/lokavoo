// تست‌های واحد برای تغییر وضعیت کسب‌وکار توسط ادمین
// این تست دقیقاً همون باگی که پیدا کردیم (approved در برابر active) رو
// برای همیشه قفل می‌کنه تا دوباره تکرار نشه.

jest.mock('../config/db', () => ({
  business: {
    update: jest.fn(),
  },
}));

const prisma = require('../config/db');
const admin = require('../controllers/admin.controller');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('admin.updateBusinessStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('وضعیت approved را می‌پذیرد (نه active) — این همان مقداری است که صفحات عمومی برای نمایش کسب‌وکار می‌خوانند', async () => {
    prisma.business.update.mockResolvedValue({ id: 1, status: 'approved' });

    const req = { params: { businessId: '1' }, body: { status: 'approved' } };
    const res = mockRes();

    await admin.updateBusinessStatus(req, res);

    expect(prisma.business.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: 'approved' },
    });
    expect(res.status).not.toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  test('وضعیت "active" را رد می‌کند — این مقدار اشتباه است و باعث می‌شد کسب‌وکار تاییدشده در سایت دیده نشود', async () => {
    const req = { params: { businessId: '1' }, body: { status: 'active' } };
    const res = mockRes();

    await admin.updateBusinessStatus(req, res);

    expect(prisma.business.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('وضعیت‌های pending، suspended و rejected را می‌پذیرد', async () => {
    for (const status of ['pending', 'suspended', 'rejected']) {
      prisma.business.update.mockResolvedValue({ id: 1, status });
      const req = { params: { businessId: '1' }, body: { status } };
      const res = mockRes();

      await admin.updateBusinessStatus(req, res);

      expect(res.status).not.toHaveBeenCalledWith(400);
    }
  });

  test('وضعیت نامعتبر و بی‌معنی را رد می‌کند', async () => {
    const req = { params: { businessId: '1' }, body: { status: 'banana' } };
    const res = mockRes();

    await admin.updateBusinessStatus(req, res);

    expect(prisma.business.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
