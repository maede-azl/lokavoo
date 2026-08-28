const prisma = require('../config/db');

exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { id: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};