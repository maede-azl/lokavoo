const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_URL = `${API_BASE_URL}/api`;

const getToken = () => localStorage.getItem("token");

const request = async (method, url, data = null) => {
  const token = getToken();

  const options = {
    method,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      Accept: "application/json",
    },
  };

  if (data instanceof FormData) {
    options.body = data;
  } else if (data !== null && data !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(data);
  }

  try {
    console.log(`📤 ${method} ${url}`);

    const response = await fetch(`${API_URL}${url}`, options);

    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("activeBusinessId");
      window.location.href = "/auth";
      throw new Error("نشست شما منقضی شده است");
    }

    if (response.status === 204) {
      console.log(`✅ پاسخ ${method} ${url}: 204 No Content`);
      return null;
    }

    const text = await response.text();
    const contentType = response.headers.get("content-type") || "";

    if (!text || text.trim() === "") {
      if (!response.ok) {
        throw new Error(`سرور پاسخ خالی داد (Status: ${response.status})`);
      }
      return null;
    }

    if (!contentType.includes("application/json")) {
      console.error("❌ Non-JSON response:", text.substring(0, 500));
      throw new Error(`سرور پاسخ غیر JSON داد (Status: ${response.status})`);
    }

    let result;
    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error("❌ JSON Parse Error:", parseError, text.substring(0, 500));
      throw new Error(`پاسخ سرور JSON معتبر نیست (Status: ${response.status})`);
    }

    if (!response.ok) {
      throw new Error(
        result.message || result.error || `خطای سرور (${response.status})`
      );
    }

    console.log(`✅ پاسخ ${method} ${url}:`, result);
    return result;
  } catch (error) {
    console.error("❌ API Error:", error);
    throw error;
  }
};

// ==================== احراز هویت ====================
const authService = {
  sendOTP: (phone, mode) => request("POST", "/auth/send-otp", { phone, mode }),

  // backend هر دو نام otp و code را پشتیبانی می‌کند؛ اینجا همان otp فرانت حفظ شده است.
  verifyOTP: (phone, otp) =>
    request("POST", "/auth/verify-otp", { phone, otp }),

  getMe: () => request("GET", "/auth/me"),

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeBusinessId");
    window.location.href = "/auth";
  },
};

// ==================== کسب‌وکار / داشبورد فروشنده ====================
const businessService = {
  getProducts: (businessId) =>
    request("GET", `/businesses/${businessId}/products`),

  getPromoTypes: () => request("GET", "/businesses/promo-types"),
  getMyPromos: (businessId) =>
    request("GET", `/businesses/${businessId}/promos`),
  requestPromo: (businessId, type) =>
    request("POST", `/businesses/${businessId}/promos`, { type }),

  getSubscriptionPlans: () => request("GET", "/subscriptions/plans"),
  getMySubscription: (businessId) =>
    request("GET", `/subscriptions/my/${businessId}`),
  initiateSubscriptionPayment: (businessId, planId) =>
    request("POST", `/payment/subscribe/${businessId}`, { planId }),

  getBusinessSettings: (businessId) =>
    request("GET", `/businesses/${businessId}/settings`),

  updateBusinessSettings: (businessId, data) =>
    request("PUT", `/businesses/${businessId}/settings`, data),

  getDashboardStats: (businessId) =>
    request("GET", `/businesses/${businessId}/stats`),

  getMyBusinesses: () => request("GET", "/businesses/mine"),

  getCategories: () => request("GET", "/categories"),

  deleteBusiness: (businessId) =>
    request("DELETE", `/businesses/${businessId}`),

  createProduct: (data) => {
    const businessId =
      data instanceof FormData ? data.get("businessId") : data?.businessId;

    if (!businessId) throw new Error("شناسه کسب‌وکار الزامی است");

    return request("POST", `/businesses/${businessId}/products`, data);
  },

  updateProduct: (productId, data) =>
    request("PUT", `/businesses/products/${productId}`, data),

  deleteProduct: (productId) =>
    request("DELETE", `/businesses/products/${productId}`),

  getReviews: (businessId) =>
    request("GET", `/reviews/business/${businessId}`),

  replyToReview: (reviewId, reply) =>
    request("POST", `/reviews/${reviewId}/reply`, { reply }),

  // پیام‌های مشتری
  getMyConversations: () => request("GET", "/messages/mine"),

  startConversation: (businessId, data) =>
    request("POST", `/messages/business/${businessId}/start`, data),

  sendCustomerMessage: (conversationId, text) =>
    request("POST", `/messages/${conversationId}/customer-send`, { text }),

  markCustomerConversationRead: (conversationId) =>
    request("PUT", `/messages/${conversationId}/customer-read`),

  // ===== پیام‌های فروشنده =====
  getConversations: (businessId) =>
    request("GET", `/messages/business/${businessId}`),

  sendMessage: (conversationId, text) =>
    request("POST", `/messages/${conversationId}/send`, { text }),

  markConversationRead: (conversationId) =>
    request("PUT", `/messages/${conversationId}/read`),

  createTestConversation: (businessId, data) =>
    request("POST", `/messages/business/${businessId}/test`, data),

  // نوتیفیکیشن‌ها
  getNotifications: (businessId) =>
    request("GET", `/notifications/business/${businessId}`),

  markNotificationRead: (id) =>
    request("PUT", `/notifications/${id}/read`),

  markAllNotificationsRead: (businessId) =>
    request("PUT", `/notifications/business/${businessId}/read-all`),

  createTestNotification: (businessId, data) =>
    request("POST", `/notifications/business/${businessId}/test`, data),

  getDashboardReports: (businessId) =>
    request("GET", `/businesses/${businessId}/reports`),
};

// ============================================
// سرویس پنل ادمین
// ============================================
const adminService = {
  getStats: () => request("GET", "/admin/stats"),

  // کاربران
  getUsers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request("GET", `/admin/users${qs ? `?${qs}` : ""}`);
  },
  updateUserStatus: (userId, status) =>
    request("PUT", `/admin/users/${userId}/status`, { status }),
  updateUserRole: (userId, role) =>
    request("PUT", `/admin/users/${userId}/role`, { role }),
  deleteUser: (userId) => request("DELETE", `/admin/users/${userId}`),

  // کسب‌وکارها (فروشندگان)
  getBusinesses: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request("GET", `/admin/businesses${qs ? `?${qs}` : ""}`);
  },
  updateBusinessStatus: (businessId, status) =>
    request("PUT", `/admin/businesses/${businessId}/status`, { status }),
  toggleBusinessBanner: (businessId) =>
    request("PUT", `/admin/businesses/${businessId}/banner`),
  deleteBusiness: (businessId) =>
    request("DELETE", `/admin/businesses/${businessId}`),

  // دسته‌بندی‌ها
  createCategory: (data) => request("POST", "/admin/categories", data),
  updateCategory: (categoryId, data) =>
    request("PUT", `/admin/categories/${categoryId}`, data),
  deleteCategory: (categoryId) =>
    request("DELETE", `/admin/categories/${categoryId}`),

  // محصولات
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request("GET", `/admin/products${qs ? `?${qs}` : ""}`);
  },
  updateProductActive: (productId, active) =>
    request("PUT", `/admin/products/${productId}/active`, { active }),
  deleteProduct: (productId) =>
    request("DELETE", `/admin/products/${productId}`),

  // پروموشن‌ها
  getPromos: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request("GET", `/admin/promos${qs ? `?${qs}` : ""}`);
  },
  updatePromoStatus: (promoId, status) =>
    request("PUT", `/admin/promos/${promoId}/status`, { status }),
  togglePromoVisible: (promoId) =>
    request("PUT", `/admin/promos/${promoId}/visible`),

  // پیام‌های پشتیبانی
  getThreads: () => request("GET", "/admin/threads"),
  startThread: (userId, text) =>
    request("POST", "/admin/threads/start", { userId, text }),
  markThreadRead: (threadId) =>
    request("PUT", `/admin/threads/${threadId}/read`),
  sendThreadMessage: (threadId, text) =>
    request("POST", `/admin/threads/${threadId}/messages`, { text }),

  // تنظیمات سایت
  getSettings: () => request("GET", "/admin/settings"),
  updateSettings: (data) => request("PUT", "/admin/settings", data),

  // فوتر
  getFooter: () => request("GET", "/admin/footer"),
  updateFooter: (data) => request("PUT", "/admin/footer", data),

  // کلیک‌ها / گزارش‌ها
  getClicks: () => request("GET", "/admin/clicks"),
  getRevenue: () => request("GET", "/admin/revenue"),
};

const api = {
  auth: authService,
  business: businessService,
  admin: adminService,
};

export { API_URL, API_BASE_URL };
export default api;
