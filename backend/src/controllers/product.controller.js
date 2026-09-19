const prisma = require('../config/db');
const { getFileUrl } = require('../services/storage');

// ایجاد محصول جدید
exports.createProduct = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);
    const { name, category, price, stock = 0, discount = 0 } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "نام محصول الزامی است"
      });
    }

    const product = await prisma.product.create({
      data: {
        business_id: businessId,
        name,
        category: category || "بدون دسته",
        price: Number(price) || 0,
        stock: Number(stock),
        discount: Number(discount),
        color: "#2547E8",
        active: true,
        image_url: req.file ? getFileUrl('businesses', req.file) : null
      },
    });

    res.status(201).json({
      success: true,
      message: "محصول با موفقیت ایجاد شد",
      data: product
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطای سرور'
    });
  }
};

// دریافت محصولات یک کسب‌وکار
exports.getProducts = async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);

    const products = await prisma.product.findMany({
      where: { business_id: businessId },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error("🔥 GET PRODUCTS FULL ERROR:", error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
};

// حذف محصول
exports.deleteProduct = async (req, res) => {
  try {
    const productId = Number(req.params.productId);

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "شناسه محصول نامعتبر است"
      });
    }

    await prisma.product.delete({
      where: { id: productId }
    });

    res.json({
      success: true,
      message: "محصول حذف شد"
    });
  } catch (error) {
    console.error("Delete Product Error:", error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: "محصول پیدا نشد"
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'خطای سرور'
    });
  }
};

// ویرایش محصول
exports.updateProduct = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const { name, category, price, stock, discount, active } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "شناسه محصول نامعتبر است"
      });
    }

    const data = {};
    if (name !== undefined) data.name = name;
    if (category !== undefined) data.category = category;
    if (price !== undefined) data.price = Number(price);
    if (stock !== undefined) data.stock = Number(stock);
    if (discount !== undefined) data.discount = Number(discount);
    if (active !== undefined) data.active = active === true || active === 'true' || active === '1';

    if (req.file) {
      data.image_url = getFileUrl('businesses', req.file);
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data,
    });

    res.json({
      success: true,
      message: "محصول با موفقیت ویرایش شد",
      data: product
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: "محصول پیدا نشد" });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'خطای سرور'
    });
  }
};