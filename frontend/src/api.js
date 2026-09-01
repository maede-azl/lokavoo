const API_URL = "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");

const request = async (method, url, data = null) => {
  const token = getToken();

  const options = {
    method,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  if (data instanceof FormData) {
    options.body = data;
  } else if (data) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(data);
  }

  try {
    console.log(`📤 ${method} ${url}`);

    const response = await fetch(`${API_URL}${url}`, options);

    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/auth";
      throw new Error("نشست شما منقضی شده است");
    }

    const text = await response.text();

    if (!text || text.trim() === "" || text.trim().startsWith("<")) {
      console.error("❌ Non-JSON response:", text.substring(0, 200));
      throw new Error(`سرور پاسخ نامعتبر داد (Status: ${response.status})`);
    }

    const result = JSON.parse(text);

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
  sendOTP: (phone) => request("POST", "/auth/send-otp", { phone }),
  verifyOTP: (phone, otp) =>
    request("POST", "/auth/verify-otp", { phone, otp }),
  getMe: () => request("GET", "/auth/me"),
  logout: () => {
    localStorage.clear();
    window.location.href = "/auth";
  },
};

// ==================== کسب‌وکار / داشبورد فروشنده ====================
const businessService = {
  getProducts: (businessId) =>
    request("GET", `/businesses/${businessId}/products`),

  getBusinessSettings: (businessId) =>
    request("GET", `/businesses/${businessId}/settings`),

  updateBusinessSettings: (businessId, data) =>
    request("PUT", `/businesses/${businessId}/settings`, data),

  getDashboardStats: (businessId) =>
    request("GET", `/businesses/${businessId}/stats`),

  getMyBusinesses: () => request("GET", "/businesses/mine"),

  createProduct: (data) => {
    let businessId =
      data instanceof FormData ? data.get("businessId") : data.businessId;
    if (!businessId) throw new Error("شناسه کسب‌وکار الزامی است");
    return request("POST", `/businesses/${businessId}/products`, data);
  },

  updateProduct: (productId, data) =>
    request("PUT", `/businesses/products/${productId}`, data),

  deleteProduct: (productId) =>
    request("DELETE", `/businesses/products/${productId}`),

  getOrders: (businessId) =>
    request("GET", `/businesses/${businessId}/orders`),

  updateOrderStatus: (orderId, status) =>
    request("PUT", `/businesses/orders/${orderId}/status`, { status }),

  getReviews: (businessId) =>
    request("GET", `/reviews/business/${businessId}`),

  replyToReview: (reviewId, reply) =>
    request("POST", `/reviews/${reviewId}/reply`, { reply }),
// پیام‌های مشتری
getMyConversations: () => request('GET', '/messages/mine'),
startConversation: (businessId, data) =>
  request('POST', `/messages/business/${businessId}/start`, data),
sendCustomerMessage: (conversationId, text) =>
  request('POST', `/messages/${conversationId}/customer-send`, { text }),
markCustomerConversationRead: (conversationId) =>
  request('PUT', `/messages/${conversationId}/customer-read`),
  // ===== پیام‌ها =====
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
  request('GET', `/notifications/business/${businessId}`),

markNotificationRead: (id) =>
  request('PUT', `/notifications/${id}/read`),

markAllNotificationsRead: (businessId) =>
  request('PUT', `/notifications/business/${businessId}/read-all`),

createTestNotification: (businessId, data) =>
  request('POST', `/notifications/business/${businessId}/test`, data),
getDashboardReports: (businessId) =>
  request('GET', `/businesses/${businessId}/reports`),
};

// ==================== اشتراک‌ها ====================
const subscriptionService = {
  getPlans: () => request("GET", "/subscriptions/plans"),

  getMySubscription: (businessId) =>
    request("GET", `/subscriptions/my/${businessId}`),

  subscribe: (businessId, planId) =>
    request("POST", "/subscriptions/subscribe", { businessId, planId }),
};

const api = {
  auth: authService,
  business: businessService,
  subscription: subscriptionService,
};

export default api;

