const prisma = require('../config/db');

// لیست مکالمات یک کسب‌وکار
exports.getConversations = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);

    const conversations = await prisma.conversation.findMany({
      where: { business_id: businessId },
      orderBy: { updated_at: 'desc' },
      include: {
        messages: {
          orderBy: { created_at: 'asc' },
          take: 50,
        },
      },
    });

    res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error('GET CONVERSATIONS ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// ارسال پیام توسط فروشنده
exports.sendMessage = async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);
    const { text } = req.body;
    const userId = req.user.id;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'متن پیام خالی است' });
    }

    // پیدا کردن مکالمه + چک مالکیت
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { business: { select: { user_id: true } } },
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'مکالمه پیدا نشد' });
    }

    if (conversation.business.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'دسترسی غیرمجاز' });
    }

    const message = await prisma.message.create({
      data: {
        conversation_id: conversationId,
        sender: 'me',
        text: text.trim(),
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        last_message: text.trim(),
        unread: false,
        updated_at: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      message: 'پیام ارسال شد',
      data: message,
    });
  } catch (error) {
    console.error('SEND MESSAGE ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// علامت‌گذاری مکالمه به‌عنوان خوانده‌شده
exports.markConversationRead = async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);
    const userId = req.user.id;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { business: { select: { user_id: true } } },
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'مکالمه پیدا نشد' });
    }

    if (conversation.business.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'دسترسی غیرمجاز' });
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { unread: false },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('MARK READ ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// ساخت مکالمه تستی (اختیاری — برای پر کردن دیتا)
exports.createTestConversation = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);
    const { customer_name, text } = req.body;

    const conversation = await prisma.conversation.create({
      data: {
        business_id: businessId,
        customer_name: customer_name || 'مشتری تست',
        last_message: text || 'سلام',
        unread: true,
        messages: {
          create: [
            {
              sender: 'them',
              text: text || 'سلام وقت بخیر',
            },
          ],
        },
      },
      include: { messages: true },
    });

    res.status(201).json({ success: true, data: conversation });
  } catch (error) {
    console.error('CREATE TEST CONV ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};
// لیست گفتگوهای مشتری لاگین‌شده
exports.getMyConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await prisma.conversation.findMany({
      where: { customer_id: userId },
      orderBy: { updated_at: 'desc' },
      include: {
        messages: {
          orderBy: { created_at: 'asc' },
          take: 50,
        },
        business: {
          select: { id: true, name: true, category: { select: { name: true } } },
        },
      },
    });
    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error('GET MY CONVERSATIONS ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// شروع یا باز کردن گفتگو با یک مغازه
exports.startOrGetConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const businessId = Number(req.params.businessId);
    const { text, productName } = req.body;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true },
    });
    if (!business) {
      return res.status(404).json({ success: false, message: 'مغازه پیدا نشد' });
    }

    let conversation = await prisma.conversation.findFirst({
      where: { business_id: businessId, customer_id: userId },
      include: {
        messages: { orderBy: { created_at: 'asc' }, take: 50 },
        business: { select: { id: true, name: true } },
      },
    });

    if (!conversation) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, phone: true },
      });

      const firstText =
        (text && text.trim()) ||
        (productName ? `سلام، درباره «${productName}» سوال داشتم.` : null);

      conversation = await prisma.conversation.create({
        data: {
          business_id: businessId,
          customer_id: userId,
          customer_name: user?.name || user?.phone || 'مشتری',
          last_message: firstText || null,
          unread: !!firstText,
          ...(firstText
            ? {
                messages: {
                  create: [{ sender: 'them', text: firstText }],
                },
              }
            : {}),
        },
        include: {
          messages: true,
          business: { select: { id: true, name: true } },
        },
      });

      // نوتیف فقط بعد از create و فقط اگر پیام اول داشتیم
      if (firstText) {
        await prisma.notification.create({
          data: {
            business_id: businessId,
            title: 'پیام جدید',
            desc:
              firstText.length > 80
                ? firstText.slice(0, 80) + '…'
                : firstText,
            icon: 'message',
            color: '#2547E8',
            read: false,
          },
        });
      }
    }

    res.json({ success: true, data: conversation });
  } catch (error) {
    console.error('START CONVERSATION ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// ارسال پیام توسط مشتری
exports.sendCustomerMessage = async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);
    const userId = req.user.id;
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: 'متن پیام خالی است' });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'مکالمه پیدا نشد' });
    }
    if (conversation.customer_id !== userId) {
      return res.status(403).json({ success: false, message: 'دسترسی غیرمجاز' });
    }

    const message = await prisma.message.create({
      data: {
        conversation_id: conversationId,
        sender: 'them',
        text: text.trim(),
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        last_message: text.trim(),
        unread: true,
        updated_at: new Date(),
      },
    });

    // نوتیفیکیشن برای فروشنده
    await prisma.notification.create({
      data: {
        business_id: conversation.business_id,
        title: 'پیام جدید',
        desc:
          text.trim().length > 80
            ? text.trim().slice(0, 80) + '…'
            : text.trim(),
        icon: 'message',
        color: '#2547E8',
        read: false,
      },
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('SEND CUSTOMER MESSAGE ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};
// علامت خوانده‌شده از سمت مشتری
exports.markCustomerConversationRead = async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);
    const userId = req.user.id;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation || conversation.customer_id !== userId) {
      return res.status(403).json({ success: false, message: 'دسترسی غیرمجاز' });
    }

    // اگر فیلد unread_for_customer نداشتی، فعلاً فقط OK برگردان
    // یا بعداً فیلد جدا برای هر طرف اضافه کن
    res.json({ success: true });
  } catch (error) {
    console.error('MARK CUSTOMER READ ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};