const prisma = require('../config/db');

exports.getPublicStats = async (req, res) => {
  try {
    // همه کسب‌وکارها رو می‌شماریم (فعلاً فیلتر status برمی‌داریم)
    const totalBusinesses = await prisma.business.count();

    // میانگین امتیاز
    const ratingAgg = await prisma.review.aggregate({
      _avg: { rating: true }
    });

    const averageRating = ratingAgg._avg.rating
      ? Number(ratingAgg._avg.rating.toFixed(1))
      : 4.8;

    // دو تا کسب‌وکار برای کارت شناور
    const featured = await prisma.business.findMany({
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