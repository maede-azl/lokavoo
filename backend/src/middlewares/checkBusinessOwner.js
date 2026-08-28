const prisma = require('../config/db');

const checkBusinessOwner = async (req, res, next) => {
  try {
    const businessId = Number(req.params.businessId || req.params.id);
    const userId = req.user.id;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'شناسه کسب‌وکار نامعتبر است',
      });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, user_id: true },
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'کسب‌وکار پیدا نشد',
      });
    }

    if (business.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'شما اجازه دسترسی به این کسب‌وکار را ندارید',
      });
    }

    // برای استفاده بعدی در کنترلر
    req.business = business;
    next();
  } catch (error) {
    console.error('CHECK BUSINESS OWNER ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

module.exports = checkBusinessOwner;