const prisma = require('../config/db');
const { z } = require('zod');
const { logActivity } = require('./activity.controller');

const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'امتیاز باید بین ۱ تا ۵ باشد').max(5),
  comment: z.string().min(4, 'نظر باید حداقل ۴ کاراکتر باشد').optional(),
});

// دریافت نظرات یک کسب‌وکار خاص
exports.getReviewsByBusiness = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);

    const reviews = await prisma.review.findMany({
      where: { business_id: businessId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const count = reviews.length;
    const average =
      count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;

    res.json({
      success: true,
      data: {
        reviews,
        count,
        average: Number(average.toFixed(1)),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// ثبت نظر جدید برای یک کسب‌وکار (نیاز به لاگین)
exports.createReview = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);
    const userId = req.user.id;
    const validated = createReviewSchema.parse(req.body);

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      return res.status(404).json({ success: false, message: 'کسب‌وکار پیدا نشد' });
    }

    const existing = await prisma.review.findUnique({
      where: {
        business_id_user_id: {
          business_id: businessId,
          user_id: userId,
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'شما قبلاً برای این کسب‌وکار نظر ثبت کرده‌اید',
      });
    }

    const review = await prisma.review.create({
      data: {
        business_id: businessId,
        user_id: userId,
        rating: validated.rating,
        comment: validated.comment || null,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    await logActivity({
      userId,
      type: 'review',
      message: `برای ${business.name} نظر ثبت کردید`,
      businessId,
    });

    res.status(201).json({
      success: true,
      message: 'نظر شما با موفقیت ثبت شد',
      data: review,
    });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

// ===== پاسخ فروشنده به یک نظر =====
exports.replyToReview = async (req, res) => {
  try {
    const reviewId = Number(req.params.reviewId);
    const userId = req.user.id;
    const { reply } = req.body;

    if (!reply || reply.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'متن پاسخ حداقل ۲ کاراکتر باشد',
      });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        business: { select: { user_id: true } },
      },
    });

    if (!review) {
      return res.status(404).json({ success: false, message: 'نظر پیدا نشد' });
    }

    if (review.business.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'شما اجازه پاسخ به این نظر را ندارید',
      });
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        reply: reply.trim(),
        replied_at: new Date(),
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    res.json({
      success: true,
      message: 'پاسخ شما ثبت شد',
      data: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};   // ← این } باید اینجا بسته شود


// ===== گرفتن نظرات خود کاربر =====
exports.getMyReviews = async (req, res) => {
  try {
    const userId = req.user.id;

    const reviews = await prisma.review.findMany({
      where: { user_id: userId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const data = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      reply: r.reply,
      repliedAt: r.replied_at,
      createdAt: r.created_at,
      businessId: r.business.id,
      shopName: r.business.name,
      tag: r.business.category?.name || '',
      category: r.business.category?.name || '',
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('GET MY REVIEWS ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};


// ===== ویرایش نظر توسط صاحب نظر =====
exports.updateReview = async (req, res) => {
  try {
    const reviewId = Number(req.params.reviewId);
    const userId = req.user.id;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'امتیاز باید بین ۱ تا ۵ باشد',
      });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return res.status(404).json({ success: false, message: 'نظر پیدا نشد' });
    }

    if (review.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'شما اجازه ویرایش این نظر را ندارید',
      });
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: Number(rating),
        comment: comment?.trim() || null,
      },
      include: {
        business: {
          select: { id: true, name: true, category: { select: { name: true } } },
        },
      },
    });

    res.json({
      success: true,
      message: 'نظر با موفقیت ویرایش شد',
      data: {
        id: updated.id,
        rating: updated.rating,
        comment: updated.comment,
        createdAt: updated.created_at,
        businessId: updated.business.id,
        shopName: updated.business.name,
        tag: updated.business.category?.name || '',
      },
    });
  } catch (error) {
    console.error('UPDATE REVIEW ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};


// ===== حذف نظر توسط صاحب نظر =====
exports.deleteReview = async (req, res) => {
  try {
    const reviewId = Number(req.params.reviewId);
    const userId = req.user.id;

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return res.status(404).json({ success: false, message: 'نظر پیدا نشد' });
    }

    if (review.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'شما اجازه حذف این نظر را ندارید',
      });
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    res.json({ success: true, message: 'نظر با موفقیت حذف شد' });
  } catch (error) {
    console.error('DELETE REVIEW ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};