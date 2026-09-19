const prisma = require('../config/db');

// دریافت یا ساخت گفتگوی پشتیبانی کاربر لاگین‌شده
exports.getMyThread = async (req, res) => {
  try {
    const userId = req.user.id;

    let thread = await prisma.adminThread.findUnique({
      where: { user_id: userId },
      include: { messages: { orderBy: { created_at: 'asc' } } },
    });

    if (!thread) {
      thread = await prisma.adminThread.create({
        data: { user_id: userId },
        include: { messages: { orderBy: { created_at: 'asc' } } },
      });
    }

    res.json({ success: true, data: thread });
  } catch (error) {
    console.error('GET MY SUPPORT THREAD ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// ارسال پیام به پشتیبانی (ادمین) توسط کاربر
exports.sendMyMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'متن پیام خالی است' });
    }

    let thread = await prisma.adminThread.findUnique({ where: { user_id: userId } });
    if (!thread) {
      thread = await prisma.adminThread.create({ data: { user_id: userId } });
    }

    const message = await prisma.adminMessage.create({
      data: { thread_id: thread.id, sender: 'user', text: text.trim() },
    });

    await prisma.adminThread.update({
      where: { id: thread.id },
      data: { updated_at: new Date(), unread: { increment: 1 } },
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('SEND MY SUPPORT MESSAGE ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};
