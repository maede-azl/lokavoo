const prisma = require('../config/db');

// دریافت نوتیفیکیشن‌های یک کسب‌وکار
exports.getNotifications = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);
    const userId = req.user.id;

    // چک مالکیت
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { user_id: true },
    });

    if (!business || business.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'دسترسی غیرمجاز' });
    }

    const notifications = await prisma.notification.findMany({
      where: { business_id: businessId },
      orderBy: { created_at: 'desc' },
    });

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error('GET NOTIFICATIONS ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// علامت‌گذاری یک نوتیفیکیشن به‌عنوان خوانده‌شده
exports.markNotificationRead = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;

    const notif = await prisma.notification.findUnique({
      where: { id },
      include: { business: { select: { user_id: true } } },
    });

    if (!notif) {
      return res.status(404).json({ success: false, message: 'نوتیفیکیشن پیدا نشد' });
    }

    if (notif.business.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'دسترسی غیرمجاز' });
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    res.json({ success: true, message: 'نوتیفیکیشن خوانده شد' });
  } catch (error) {
    console.error('MARK NOTIF READ ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// علامت‌گذاری همه نوتیفیکیشن‌ها به‌عنوان خوانده‌شده
exports.markAllNotificationsRead = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);
    const userId = req.user.id;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { user_id: true },
    });

    if (!business || business.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'دسترسی غیرمجاز' });
    }

    await prisma.notification.updateMany({
      where: { business_id: businessId },
      data: { read: true },
    });

    res.json({ success: true, message: 'همه نوتیفیکیشن‌ها خوانده شدند' });
  } catch (error) {
    console.error('MARK ALL READ ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// ساخت نوتیفیکیشن جدید (برای تست — می‌توانی حذف کنی)
exports.createNotification = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);
    const { title, desc, icon, color } = req.body;

    const notif = await prisma.notification.create({
      data: {
        business_id: businessId,
        title,
        desc: desc || null,
        icon: icon || null,
        color: color || null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'نوتیفیکیشن جدید ساخته شد',
      data: notif,
    });
  } catch (error) {
    console.error('CREATE NOTIFICATION ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};