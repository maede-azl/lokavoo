import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./FavoritesPage.css";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import { getSidebarItems, getBottomNavItems, getSellerMenuItem } from "../components/navConfig";
import { useTheme } from "../context/ThemeContext";
import logoBlack from "../assets/locavo-logo-black.png";
import logoWhite from "../assets/locavo-logo-white.png";

const API_BASE = "http://localhost:5000";

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
/* آیکون‌ها                                                              */
/* ------------------------------------------------------------------ */
const SaveIcon = ({ filled = false }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
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

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.6l-5.9 3 1.3-6.6-4.9-4.6 6.6-.8L12 2.5Z" />
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

const relativeTime = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDay <= 0) return "امروز";
  if (diffDay === 1) return "دیروز";
  if (diffDay < 7) return `${diffDay} روز پیش`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} هفته پیش`;
  return `${Math.floor(diffDay / 30)} ماه پیش`;
};

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const [activeNav, setActiveNav] = useState("favorites");
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [hasOwnBusiness, setHasOwnBusiness] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const isLoggedIn = !!getToken();
  const authUser = getAuthUser();
  const logoImg = isDark ? logoWhite : logoBlack;

  // بررسی اینکه فروشنده کسب‌وکار دارد یا نه
  useEffect(() => {
    if (!isLoggedIn || authUser?.role !== "seller") {
      setHasOwnBusiness(false);
      return;
    }
    const token = getToken();
    fetch(`${API_BASE}/api/businesses/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setHasOwnBusiness(!!data.success && data.count > 0))
      .catch((err) => {
        console.error("خطا در بررسی کسب‌وکار فروشنده:", err);
        setHasOwnBusiness(false);
      });
  }, [isLoggedIn, authUser]);

  // گرفتن لیست بوکمارک‌های واقعی از بک‌اند
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/auth");
      return;
    }
    let cancelled = false;
    const fetchBookmarks = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/bookmarks`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "خطا در دریافت لیست بوکمارک‌ها");
        }
        if (!cancelled) setBookmarks(json.data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchBookmarks();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, navigate]);

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

  // ساخت تب‌ها به‌صورت پویا از دسته‌بندی‌های واقعی موجود در بوکمارک‌ها
  const tabs = useMemo(() => {
    const seen = new Map();
    bookmarks.forEach((bm) => {
      const cat = bm.business?.category;
      if (cat && !seen.has(cat.key_name)) {
        seen.set(cat.key_name, cat.name);
      }
    });
    return [
      { key: "all", label: "همه" },
      ...Array.from(seen, ([key, label]) => ({ key, label })),
    ];
  }, [bookmarks]);

  const filtered = useMemo(() => {
    if (activeTab === "all") return bookmarks;
    return bookmarks.filter((bm) => bm.business?.category?.key_name === activeTab);
  }, [bookmarks, activeTab]);

  const removeBookmark = async (businessId) => {
    if (removingId) return;
    setRemovingId(businessId);
    const prev = bookmarks;
    // آپدیت خوش‌بینانه
    setBookmarks((list) => list.filter((bm) => bm.business.id !== businessId));

    try {
      const res = await fetch(`${API_BASE}/api/bookmarks/${businessId}/toggle`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "خطا در حذف بوکمارک");
      }
      // اگه سرور گفت هنوز bookmarked=true (یعنی toggle برعکس عمل کرده)، برگردون
      if (json.bookmarked) {
        setBookmarks(prev);
      }
    } catch (err) {
      console.error("خطا در حذف بوکمارک:", err);
      setBookmarks(prev); // برگردوندن در صورت خطا
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="fav-page lookavoo" dir="rtl">
      <div className="app-shell">
        <Sidebar
          items={SIDEBAR_NAV_ITEMS}
          activeNav={activeNav}
          onNavClick={handleNavClick}
          logoImg={logoImg}
        />
        <div className="main">
          <div className="fav-content">
            {/* هدر صفحه */}
            <div className="fav-header">
              <div className="fav-header-right">
                <img src={logoImg} alt="لوکاوو" className="fav-mobile-logo" />
                <button className="fav-icon-btn" onClick={() => navigate(-1)} title="بازگشت">
                  <BackIcon />
                </button>
                <div className="fav-title-wrap">
                  <h1 className="fav-title">
                    <span className="fav-title-icon">
                      <SaveIcon filled />
                    </span>
                    موارد ذخیره‌شده
                  </h1>
                </div>
              </div>
              <button className="fav-icon-btn fav-theme-btn" onClick={toggleTheme} title="تغییر تم">
                {isDark ? <MoonIcon /> : <SunIcon />}
              </button>
            </div>

            {/* تب‌های فیلتر (پویا) */}
            {tabs.length > 1 && (
              <div className="fav-tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    className={activeTab === tab.key ? "active" : ""}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* حالت لودینگ */}
            {loading && (
              <div style={{ textAlign: "center", padding: "40px" }}>در حال بارگذاری...</div>
            )}

            {/* حالت خطا */}
            {!loading && error && (
              <div style={{ textAlign: "center", padding: "40px", color: "#e11d48" }}>{error}</div>
            )}

            {/* گرید کارت‌ها یا حالت خالی */}
            {!loading && !error && (
              filtered.length > 0 ? (
                <div className="fav-grid">
                  {filtered.map((bm) => {
                    const shop = bm.business;
                    return (
                      <div
                        className="fav-card"
                        key={bm.bookmarkId}
                        onClick={() => navigate(`/business/${shop.id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <button
                          className="fav-heart-btn is-fav"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBookmark(shop.id);
                          }}
                          disabled={removingId === shop.id}
                          aria-label="حذف از بوکمارک‌ها"
                          title="حذف از بوکمارک‌ها"
                        >
                          <SaveIcon filled />
                        </button>
                        <div
                          className="shop-media"
                          style={{
                            background: shop.image ? "none" : "#2547E8",
                            backgroundImage: shop.image ? `url(${API_BASE}${shop.image})` : "none",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        >
                          {!shop.image && <StoreIcon />}
                        </div>
                        <div className="shop-body">
                          <div className="shop-name">
                            {shop.name}
                            {shop.status === "approved" && <BadgeCheckIcon />}
                          </div>
                          <div className="shop-tag">{shop.category?.name || "بدون دسته‌بندی"}</div>
                          <div className="shop-meta">
                            <div className="rating">
                              <StarIcon />
                              {shop.avgRating || 0}
                            </div>
                            <div className="fav-added-at">
                              <ClockIcon />
                              {relativeTime(bm.bookmarkedAt)}
                            </div>
                          </div>
                          <div className="shop-addr">
                            <MapPinIcon /> {shop.address || "آدرس ثبت نشده"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="fav-empty">
                  <div className="fav-empty-icon">
                    <SaveIcon />
                  </div>
                  <h3>هنوز چیزی ذخیره نکرده‌اید</h3>
                  <p>
                    کسب‌وکارهای مورد علاقه‌تون رو با زدن آیکون بوکمارک ذخیره کنید تا همیشه
                    سریع بهشون دسترسی داشته باشید.
                  </p>
                  <button className="fav-empty-cta" onClick={() => navigate("/")}>
                    جستجوی فروشگاه‌ها
                  </button>
                </div>
              )
            )}
          </div>
          <Footer />
        </div>
      </div>
      <BottomNav items={BOTTOM_NAV_ITEMS} activeNav={activeNav} onNavClick={handleNavClick} />
    </div>
  );
}