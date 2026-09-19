// تست‌های واحد برای حذف حساب کاربری — یک عملیات غیرقابل‌بازگشت
// که باید همیشه به همان ترتیب درست (نظرات/بوکمارک‌ها/تاریخچه قبل از خود کاربر) پاک کند.

jest.mock('../config/db', () => ({
  review: { deleteMany: jest.fn() },
  bookmark: { deleteMany: jest.fn() },
  viewHistory: { deleteMany: jest.fn() },
  user: { delete: jest.fn() },
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

const prisma = require('../config/db');
const fs = require('fs');
const profileController = require('../controllers/profile.controller');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('profile.deleteMyAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.review.deleteMany.mockResolvedValue({});
    prisma.bookmark.deleteMany.mockResolvedValue({});
    prisma.viewHistory.deleteMany.mockResolvedValue({});
    prisma.user.delete.mockResolvedValue({});
  });

  test('نظرات، بوکمارک‌ها و تاریخچه‌ی بازدید کاربر را قبل از حذف خود کاربر پاک می‌کند', async () => {
    const req = { user: { id: 42, avatar: null } };
    const res = mockRes();

    await profileController.deleteMyAccount(req, res);

    expect(prisma.review.deleteMany).toHaveBeenCalledWith({ where: { user_id: 42 } });
    expect(prisma.bookmark.deleteMany).toHaveBeenCalledWith({ where: { user_id: 42 } });
    expect(prisma.viewHistory.deleteMany).toHaveBeenCalledWith({ where: { user_id: 42 } });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 42 } });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  test('اگر کاربر آواتار دارد، فایل آن را هم از دیسک پاک می‌کند', async () => {
    fs.existsSync.mockReturnValue(true);
    const req = { user: { id: 7, avatar: '/uploads/avatars/pic.jpg' } };
    const res = mockRes();

    await profileController.deleteMyAccount(req, res);

    expect(fs.unlinkSync).toHaveBeenCalled();
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 7 } });
  });

  test('اگر کاربر آواتار ندارد، سراغ فایل سیستم نمی‌رود', async () => {
    const req = { user: { id: 8, avatar: null } };
    const res = mockRes();

    await profileController.deleteMyAccount(req, res);

    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });

  test('در صورت خطای دیتابیس، پاسخ ۵۰۰ برمی‌گرداند و حساب کاربر دست‌نخورده باقی می‌ماند', async () => {
    prisma.user.delete.mockRejectedValue(new Error('DB down'));
    const req = { user: { id: 9, avatar: null } };
    const res = mockRes();

    await profileController.deleteMyAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
