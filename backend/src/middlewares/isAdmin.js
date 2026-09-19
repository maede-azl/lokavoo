// isAdmin.js
// باید بعد از protect استفاده شود؛ چک می‌کند نقش کاربر ادمین است یا نه
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'لطفا ابتدا وارد شوید',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'شما اجازه دسترسی به پنل ادمین را ندارید',
    });
  }

  next();
};

module.exports = isAdmin;
