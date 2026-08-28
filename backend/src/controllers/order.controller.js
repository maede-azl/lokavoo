const prisma = require('../config/db');

exports.getOrders = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);
    
    const orders = await prisma.order.findMany({
      where: { business_id: businessId },
      orderBy: { created_at: 'desc' },
    });
    
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error in getOrders:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت سفارش‌ها' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const { status } = req.body;
    
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
    
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی سفارش' });
  }
};