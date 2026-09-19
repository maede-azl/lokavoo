import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// HomePage همیشه در بار اول لود می‌شود (لندینگ اصلی اپ)، بقیه‌ی صفحات
// به‌صورت lazy لود می‌شوند تا حجم اولیه‌ی جاوااسکریپت اپ کمتر بشه —
// خصوصاً پنل ادمین و سلر دشبورد که خیلی سنگین‌اند و اکثر کاربرها اصلاً
// بهشون سر نمی‌زنن.
import HomePage from "./HomePage.jsx";
const SearchResultsPage = lazy(() => import("./pages/SearchResultsPage.jsx"));
const CategoryPage = lazy(() => import("./pages/CategoryPage.jsx"));
const BusinessDetailPage = lazy(() => import("./pages/BusinessDetailPage.jsx"));
const AddBusiness = lazy(() => import("./pages/AddBusiness.jsx"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard.jsx"));
const AuthPage = lazy(() => import("./pages/AuthPage.jsx"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage.jsx"));
const LokaooCategories = lazy(() => import("./pages/LokaooCategories.jsx"));
const ProfilePage = lazy(() => import("./pages/ProfilePage.jsx"));
const MyChatsPage = lazy(() => import("./pages/MyChatsPage.jsx"));
const SupportChatPage = lazy(() => import("./pages/SupportChatPage.jsx"));
const AdminDashboard = lazy(() => import("./admin/AdminDashboard.jsx"));
const ReviewsPage = lazy(() => import("./pages/Reviewspage.jsx"));
const RecentViewsPage = lazy(() => import("./pages/RecentViewsPage.jsx"));
const EditBusiness = lazy(() => import("./pages/EditBusiness.jsx"));
const InfoPage = lazy(() => import("./pages/InfoPage.jsx"));

// یک لودینگ خیلی ساده و سبک تا وقتی کد صفحه‌ی مقصد از سرور دانلود می‌شه
function RouteFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: "3px solid rgba(37,71,232,0.15)",
          borderTopColor: "#2547E8",
          animation: "route-fallback-spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes route-fallback-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// اگر لود شدن کد یک صفحه (chunk) به هر دلیلی شکست بخوره (مثلاً بعد از یک
// دیپلوی جدید، نسخه‌ی قدیمی صفحه در تب باز مونده و فایل قدیمی دیگه روی
// سرور نیست) یا هر خطای دیگه‌ای در رندر پیش بیاد، به‌جای صفحه‌ی سفید خالی
// یک پیام واضح با دکمه‌ی «تلاش دوباره» نشون می‌دیم.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("خطای رندر صفحه:", error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 24,
            gap: 14,
          }}
        >
          <h2 style={{ margin: 0 }}>مشکلی در بارگذاری صفحه پیش اومد</h2>
          <p style={{ color: "#666", maxWidth: 380 }}>
            ممکنه اینترنتتون قطع شده باشه یا نسخه‌ی جدیدی از سایت منتشر شده باشه.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              border: "none",
              background: "#2547E8",
              color: "#fff",
              fontWeight: 700,
              padding: "10px 22px",
              borderRadius: 999,
              cursor: "pointer",
            }}
          >
            تلاش دوباره
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// اگر ادمین «حالت تعمیر» را در پنل خودش روشن کند، این کامپوننت
// به‌جای کل سایت یک پیام تعمیر نشان می‌دهد (به‌جز برای خود ادمین)
function MaintenanceGate({ children }) {
  const [maintenance, setMaintenance] = React.useState(false);
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/settings/public`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json?.success) {
          setMaintenance(!!json.data?.maintenance_mode);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  let isAdmin = false;
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    isAdmin = storedUser?.role === 'admin';
  } catch {
    isAdmin = false;
  }

  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  const bypass = isAdmin || path.startsWith('/admin') || path.startsWith('/auth');

  if (checked && maintenance && !bypass) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 24,
          fontFamily: 'inherit',
        }}
      >
        <h1 style={{ marginBottom: 12 }}>سایت در حال به‌روزرسانی است</h1>
        <p style={{ color: '#666', maxWidth: 420 }}>
          لوکاوو موقتاً در حالت تعمیر و نگهداری است. لطفاً کمی بعد دوباره سر بزنید.
        </p>
      </div>
    );
  }

  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <MaintenanceGate>
        <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* ===== صفحات عمومی ===== */}
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/businesses/:id" element={<BusinessDetailPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/categories" element={<LokaooCategories />} />
          <Route path="/info/:slug" element={<InfoPage />} />

          {/* ===== کاربر لاگین‌کرده ===== */}
          <Route
            path="/reviews"
            element={
              <ProtectedRoute>
                <ReviewsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/recent-views"
            element={
              <ProtectedRoute>
                <RecentViewsPage />
              </ProtectedRoute>
            }
          />

          {/* ===== پنل ادمین ===== */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* ===== کاربر لاگین‌کرده ===== */}
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* ===== پشتیبانی با ادمین ===== */}
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <SupportChatPage />
              </ProtectedRoute>
            }
          />

          {/* ===== چت‌ها (خریدار و فروشنده) ===== */}
          <Route
            path="/my-chats"
            element={
              <ProtectedRoute>
                <MyChatsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-chats/:businessId"
            element={
              <ProtectedRoute>
                <MyChatsPage />
              </ProtectedRoute>
            }
          />

          {/* مسیرهای قدیمی → ریدایرکت به مسیر جدید */}
          <Route path="/chat/:businessId" element={<Navigate to="/my-chats" replace />} />
          <Route path="/seller/messages" element={<Navigate to="/my-chats" replace />} />

          {/* ===== فقط فروشنده ===== */}
          <Route
            path="/add-business"
            element={
              <ProtectedRoute allowedRoles={["seller"]}>
                <AddBusiness />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-business/:id"
            element={
              <ProtectedRoute allowedRoles={["seller"]}>
                <EditBusiness />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/dashboard"
            element={
              <ProtectedRoute allowedRoles={["seller"]}>
                <SellerDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
        </Suspense>
        </ErrorBoundary>
        </MaintenanceGate>
      </BrowserRouter>
    </ThemeProvider>
  );
}