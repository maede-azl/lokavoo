import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ReviewsPage.css";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import { getSidebarItems, getBottomNavItems, getSellerMenuItem } from "../components/navConfig";
import { useTheme } from "../context/ThemeContext";
import logoBlack from "../assets/locavo-logo-black.png";
import logoWhite from "../assets/locavo-logo-white.png";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const getToken = () => localStorage.getItem("token");
const getAuthUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/* ------------------------------------------------------------------ */
/* آیکون‌ها                                                           */
/* ------------------------------------------------------------------ */
const EyeIcon = ({ filled = false }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const StoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l1.5-5h15L21 9M3 9v10a1 1 0 0 0 1 1h4v-6h8v6h4a1 1 0 0 0 1-1V9M3 9h18" />
  </svg>
);
const BadgeCheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 12l2 2 4-4" />
    <path d="M12 2l2.4 1.2 2.6-.4 1.3 2.3 2.3 1.3-.4 2.6L21 12l-1.2 2.4.4 2.6-2.3 1.3-1.3 2.3-2.6-.4L12 22l-2.4-1.2-2.6.4-1.3-2.3-2.3-1.3.4-2.6L3 12l1.2-2.4-.4-2.6 2.3-1.3 1.3-2.3 2.6.4Z" />
  </svg>
);
const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.3" />
  </svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M9 18l6-6-6-6" />
  </svg>
);
const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.5v2.4M12 19v2.5M4.2 4.2l1.7 1.7M18 18l1.7 1.7M2.5 12h2.4M19 12h2.5M4.2 19.8l1.7-1.7M18 6l1.7-1.7" />
  </svg>
);
const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 6.8 6.8 0 0 0 20 14.5Z" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6h12Z" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

const relativeTime = (dateStr) => {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return "چند دقیقه پیش";
  if (diffH < 24) return `${diffH} ساعت پیش`;
  const diffDay = Math.floor(diffH / 24);
  if (diffDay === 1) return "دیروز";
  if (diffDay < 7) return `${diffDay} روز پیش`;
  return new Date(dateStr).toLocaleDateString("fa-IR");
};

export default function RecentViewsPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const [activeNav, setActiveNav] = useState("recent-views");
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [hasOwnBusiness, setHasOwnBusiness] = useState(false);
  const isLoggedIn = !!getToken();
  const authUser = getAuthUser();
  const logoImg = isDark ? logoWhite : logoBlack;

  // چک کسب‌وکار فروشنده
  useEffect(() => {
    if (!isLoggedIn || authUser?.role !== "seller") {
      setHasOwnBusiness(false);
      return;
    }
    const token = getToken();
    if (!token) {
      setHasOwnBusiness(false);
      return;
    }
    fetch(`${API_BASE}/api/businesses/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setHasOwnBusiness(data.count > 0);
        } else {
          setHasOwnBusiness(false);
        }
      })
      .catch(() => setHasOwnBusiness(false));
  }, [isLoggedIn, authUser]);

  // ===== گرفتن بازدیدهای اخیر از بک‌اند =====
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/api/activity/recent-views?limit=30`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          const mapped = json.data.map((item, idx) => ({
            id: item.businessId || `v-${idx}`,
            businessId: item.businessId,
            shopName: item.name || "بدون نام",
            tag: item.category || "",
            category: item.category || "all",
            color: "#2547E8",
            verified: false,
            address: "",
            date: relativeTime(item.viewedAt),
          }));
          setViews(mapped);
        }
      })
      .catch((err) => console.error("خطا در دریافت بازدیدهای اخیر:", err))
      .finally(() => setLoading(false));
  }, []);

  const sellerMenuItem = useMemo(
    () => getSellerMenuItem(isLoggedIn, authUser, hasOwnBusiness),
    [isLoggedIn, authUser, hasOwnBusiness]
  );

  const SIDEBAR_NAV_ITEMS = useMemo(
    () => getSidebarItems(sellerMenuItem, isLoggedIn),
    [sellerMenuItem, isLoggedIn]
  );
  const BOTTOM_NAV_ITEMS = useMemo(
    () => getBottomNavItems(sellerMenuItem, isLoggedIn),
    [sellerMenuItem, isLoggedIn]
  );

  const handleNavClick = (item) => {
    setActiveNav(item.key);
    if (item.path) navigate(item.path);
  };

  const filtered = useMemo(() => {
    if (activeTab === "all") return views;
    return views.filter((item) => item.category === activeTab);
  }, [views, activeTab]);

  // تب‌های داینامیک
  const dynamicTabs = useMemo(() => {
    const tabs = [{ key: "all", label: "همه" }];
    const seen = new Set();
    views.forEach((v) => {
      const cat = (v.category || "").trim();
      if (cat && cat !== "all" && !seen.has(cat)) {
        seen.add(cat);
        tabs.push({ key: cat, label: cat });
      }
    });
    return tabs;
  }, [views]);

  // حذف محلی (فعلاً، چون بک‌اند endpoint حذف ندارد)
  const removeView = (id) => {
    if (!window.confirm("آیا از حذف این بازدید مطمئن هستید؟")) return;
    setViews((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="rev-page lookavoo" dir="rtl">
      <div className="app-shell">
        <Sidebar
          items={SIDEBAR_NAV_ITEMS}
          activeNav={activeNav}
          onNavClick={handleNavClick}
          logoImg={logoImg}
        />
        <div className="main">
          <div className="rev-content">
            {/* هدر صفحه */}
            <div className="rev-header">
              <div className="rev-header-right">
                <img src={logoImg} alt="لوکاوو" className="rev-mobile-logo" />
                <button className="rev-icon-btn" onClick={() => navigate(-1)} title="بازگشت">
                  <BackIcon />
                </button>
                <div className="rev-title-wrap">
                  <h1 className="rev-title">
                    <span className="rev-title-icon">
                      <EyeIcon filled />
                    </span>
                    بازدیدهای اخیر
                  </h1>
                </div>
              </div>
              <button className="rev-icon-btn rev-theme-btn" onClick={toggleTheme} title="تغییر تم">
                {isDark ? <MoonIcon /> : <SunIcon />}
              </button>
            </div>

            {/* تب‌های فیلتر */}
            <div className="rev-tabs">
              {dynamicTabs.map((tab) => (
                <button
                  key={tab.key}
                  className={activeTab === tab.key ? "active" : ""}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* لودینگ یا گرید یا خالی */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                در حال بارگذاری بازدیدها...
              </div>
            ) : filtered.length > 0 ? (
              <div className="rev-grid">
                {filtered.map((item) => (
                  <div
                    className="rev-card"
                    key={item.id}
                    onClick={() => navigate(`/businesses/${item.businessId}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="rev-actions">
                      <button
                        className="rev-action-btn rev-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeView(item.id);
                        }}
                        aria-label="حذف بازدید"
                        title="حذف بازدید"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                    <div className="shop-media" style={{ background: item.color }}>
                      <StoreIcon />
                    </div>
                    <div className="shop-body">
                      <div className="shop-name">
                        {item.shopName}
                        {item.verified && <BadgeCheckIcon />}
                      </div>
                      <div className="shop-tag">{item.tag}</div>
                      <div className="shop-meta">
                        <div className="fav-added-at">
                          <ClockIcon />
                          {item.date}
                        </div>
                      </div>
                      {item.address && (
                        <div className="shop-addr">
                          <MapPinIcon /> {item.address}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rev-empty">
                <div className="rev-empty-icon">
                  <EyeIcon />
                </div>
                <h3>هنوز بازدیدی ثبت نشده</h3>
                <p>
                  فروشگاه‌هایی که اخیراً مشاهده کرده‌اید اینجا نمایش داده می‌شوند.
                </p>
                <button className="rev-empty-cta" onClick={() => navigate("/")}>
                  مشاهده‌ی فروشگاه‌ها
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
      <BottomNav items={BOTTOM_NAV_ITEMS} activeNav={activeNav} onNavClick={handleNavClick} />
    </div>
  );
}