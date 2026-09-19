const prisma = require('../config/db');

exports.getPublicStats = async (req, res) => {
  try {
    // فقط کسب‌وکارهای واقعاً تاییدشده و عمومی رو بشمار
    const totalBusinesses = await prisma.business.count({
      where: { status: 'approved' },
    });

    // میانگین امتیاز — فقط نظرات مربوط به کسب‌وکارهای تاییدشده
    const ratingAgg = await prisma.review.aggregate({
      _avg: { rating: true },
      where: { business: { status: 'approved' } },
    });

    const averageRating = ratingAgg._avg.rating
      ? Number(ratingAgg._avg.rating.toFixed(1))
      : 4.8;

    // دو تا کسب‌وکار برای کارت شناور — فقط از بین تاییدشده‌ها
    const featured = await prisma.business.findMany({
      where: { status: 'approved' },
      take: 2,
      orderBy: { id: 'desc' },
      select: {
        id: true,
        name: true,
        address: true,
      }
    });

    res.json({
      success: true,
      data: {
        totalBusinesses,
        averageRating,
        featuredBusinesses: featured
      }
    });
  } catch (error) {
    console.error('GET PUBLIC STATS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت آمار'
    });
  }
};