// BusinessDetailPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./BusinessDetailPage.css";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import { getSidebarItems, getBottomNavItems, getSellerMenuItem } from "../components/navConfig";
import { useTheme } from "../context/ThemeContext";
import logoBlack from "../assets/locavo-logo-black.png";
import logoWhite from "../assets/locavo-logo-white.png";

const API_URL = "http://localhost:5000";
const getToken = () => localStorage.getItem("token");

const persianDigits = (input) => {
  const map = { 0: "۰", 1: "۱", 2: "۲", 3: "۳", 4: "۴", 5: "۵", 6: "۶", 7: "۷", 8: "۸", 9: "۹" };
  return String(input).replace(/[0-9]/g, (d) => map[d]);
};

const formatTime = (isoTime) => {
  if (!isoTime) return null;
  const d = new Date(isoTime);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return persianDigits(`${hh}:${mm}`);
};

const formatPrice = (n) => {
  if (n === null || n === undefined || n === "") return null;
  const num = Number(n);
  if (Number.isNaN(num)) return null;
  return persianDigits(num.toLocaleString("en-US"));
};

const avatarColors = ["#2547E8", "#16A34A", "#EC4899", "#FF9736", "#8B5CF6"];

const TAB_LIST = [
  {
    key: "products",
    label: "محصولات",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 7 12 3 4 7l8 4 8-4Z" />
        <path d="M4 7v10l8 4 8-4V7M12 11v10" />
      </svg>
    ),
  },
  {
    key: "info",
    label: "اطلاعات",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
  },
  {
    key: "reviews",
    label: "نظرات",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
      </svg>
    ),
  },
];

const PRODUCT_FILTERS = [
  { key: "all", label: "همه" },
  { key: "newest", label: "جدیدترین" },
  { key: "top", label: "پرفروش‌ترین" },
  { key: "cheap", label: "ارزان‌ترین" },
];

export default function BusinessDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { theme, toggleTheme, isDark } = useTheme();

  const [activeNav, setActiveNav] = useState("");
const [saved, setSaved] = useState(false);
const [bookmarkLoading, setBookmarkLoading] = useState(false);
const [chosenRating, setChosenRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [business, setBusiness] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // ---- تب‌های محصولات / اطلاعات / نظرات ----
  const [activeTab, setActiveTab] = useState("products");
  const [productFilter, setProductFilter] = useState("all");

  // ---- auth / seller ----
  const [authUser, setAuthUser] = useState(() => {
    const saved = localStorage.getItem("user");
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });
  const isLoggedIn = !!authUser;
  const [hasOwnBusiness, setHasOwnBusiness] = useState(false);
  const [checkingBusiness, setCheckingBusiness] = useState(true);

  useEffect(() => {
    if (!isLoggedIn || authUser?.role !== "seller") {
      setCheckingBusiness(false);
      setHasOwnBusiness(false);
      return;
    }
    const token = getToken();
    setCheckingBusiness(true);
    fetch(`${API_URL}/api/businesses/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setHasOwnBusiness(data.count > 0);
      })
      .catch((err) => console.error("خطا در بررسی کسب‌وکار فروشنده:", err))
      .finally(() => setCheckingBusiness(false));
  }, [isLoggedIn, authUser]);

  const sellerMenuItem = getSellerMenuItem(isLoggedIn, authUser, hasOwnBusiness);
  const SIDEBAR_NAV_ITEMS = getSidebarItems(sellerMenuItem, isLoggedIn);
  const BOTTOM_NAV_ITEMS = getBottomNavItems(sellerMenuItem, isLoggedIn);

useEffect(() => {
  if (!id || !isLoggedIn) {
    setSaved(false);
    return;
  }
  const token = getToken();
  fetch(`${API_URL}/api/bookmarks/${id}/status`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.success) setSaved(json.bookmarked);
    })
    .catch((err) => console.error("خطا در دریافت وضعیت بوکمارک:", err));
}, [id, isLoggedIn]);

  useEffect(() => {
  let cancelled = false;
  const fetchBusiness = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/businesses/${id}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "خطا در دریافت اطلاعات");
      }
      if (!cancelled) {
        setBusiness(json.data);

        // ثبت بازدید (فقط اگه کاربر لاگین باشه)
        const token = getToken();
        if (token) {
          fetch(`${API_URL}/api/activity/view/${id}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          }).catch((err) => console.error("خطا در ثبت بازدید:", err));
        }

        const listRes = await fetch(`${API_URL}/api/businesses`);
        const listJson = await listRes.json();
        if (listRes.ok && listJson.success) {
          const sameCategory = listJson.data
            .filter((b) => b.category_id === json.data.category_id && b.id !== json.data.id)
            .slice(0, 2);
          setSimilar(sameCategory);
        }
      }
    } catch (err) {
      if (!cancelled) setError(err.message);
    } finally {
      if (!cancelled) setLoading(false);
    }
  };
  fetchBusiness();
  return () => {
    cancelled = true;
  };
}, [id]);

  const paintStars = (v, size = "sm") => {
    const rounded = Math.round(v);
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        viewBox="0 0 24 24"
        fill={i < rounded ? "#FFB020" : "#D1D5DB"}
        className={`${i < rounded ? "on" : ""} star-${size}`}
      >
        <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
      </svg>
    ));
  };

  const submitReview = async () => {
    if (!(chosenRating > 0 && reviewText.trim().length > 3)) return;
    const token = getToken();
    if (!token) {
      setSubmitError("برای ثبت نظر باید وارد حساب کاربری خود شوید");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`${API_URL}/api/reviews/business/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: chosenRating, comment: reviewText.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "ثبت نظر با خطا مواجه شد");
      }
      setBusiness((prev) => {
        const newReview = json.data;
        const otherReviews = prev.reviews.filter((r) => r.id !== newReview.id);
        const updatedReviews = [newReview, ...otherReviews];
        const avg =
          updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
        return {
          ...prev,
          reviews: updatedReviews,
          reviewsCount: updatedReviews.length,
          avgRating: Number(avg.toFixed(1)),
        };
      });
      setChosenRating(0);
      setReviewText("");
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const trackAction = async (type) => {
    try {
      await fetch(`${API_URL}/api/businesses/${id}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
    } catch (err) {
      console.error("خطا در ثبت آمار:", err);
    }
  };

  const handleToggleBookmark = async () => {
  const token = getToken();
  if (!token) {
    navigate("/auth");
    return;
  }
  if (bookmarkLoading) return;

  setBookmarkLoading(true);
  // آپدیت خوش‌بینانه (optimistic) برای حس سریع‌تر
  const prevSaved = saved;
  setSaved((v) => !v);

  try {
    const res = await fetch(`${API_URL}/api/bookmarks/${id}/toggle`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || "خطا در بوکمارک");
    }
    setSaved(json.bookmarked);
  } catch (err) {
    console.error("خطا در بوکمارک:", err);
    setSaved(prevSaved); // برگردوندن به حالت قبل در صورت خطا
  } finally {
    setBookmarkLoading(false);
  }
};

const handleShare = async () => {
  const url = window.location.href;
  if (navigator.share) {
    try {
      await navigator.share({ title: business?.name, url });
    } catch {
      /* کاربر لغو کرده، مشکلی نیست */
    }
  } else {
    try {
      await navigator.clipboard.writeText(url);
      // اگه سیستم toast جدا داری، اینجا صداش بزن
    } catch (err) {
      console.error("خطا در کپی لینک:", err);
    }
  }
};

  const logoImg = isDark ? logoWhite : logoBlack;

  const handleNavClick = (item) => {
    setActiveNav(item.key);
    if (item.path) navigate(item.path);
  };

 const goToChat = async (extra = {}) => {
  if (!business) return;
  const token = getToken();
  if (!token) {
    navigate('/auth');
    return;
  }
  try {
    trackAction('message');
    const res = await fetch(`${API_URL}/api/messages/business/${business.id}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
 body: JSON.stringify({
  // فقط وقتی از سفارش محصول اومده:
  ...(extra.productName ? { productName: extra.productName } : {}),
}),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'خطا');
    navigate('/my-chats', {
      state: { conversationId: json.data.id, businessId: business.id },
    });
  } catch (err) {
    console.error(err);
    // fallback
    navigate('/my-chats');
  }
};
  const handleOrderProduct = (product) => {
    trackAction("order");
    goToChat({ productName: product?.name });
  };

  // ---- داده‌ی محصولات (اختیاری - در صورت وجود از بک‌اند) ----
  const products = business?.products || [];
  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (productFilter === "newest") {
      list = list.slice().reverse();
    } else if (productFilter === "top") {
      list = list.slice().sort((a, b) => (b.sales || 0) - (a.sales || 0));
    } else if (productFilter === "cheap") {
      list = list.slice().sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    }
    return list;
  }, [products, productFilter]);

  if (loading) {
    return (
      <div className="bdp-page lookavoo" dir="rtl">
        <div className="app-shell">
          <Sidebar items={SIDEBAR_NAV_ITEMS} activeNav={activeNav} onNavClick={handleNavClick} logoImg={logoImg} />
          <div className="main">
            <div className="content" style={{ padding: "40px", textAlign: "center" }}>
              در حال بارگذاری...
            </div>
          </div>
        </div>
        <BottomNav items={BOTTOM_NAV_ITEMS} activeNav={activeNav} onNavClick={handleNavClick} />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="bdp-page lookavoo" dir="rtl">
        <div className="app-shell">
          <Sidebar items={SIDEBAR_NAV_ITEMS} activeNav={activeNav} onNavClick={handleNavClick} logoImg={logoImg} />
          <div className="main">
            <div className="content" style={{ padding: "40px", textAlign: "center" }}>
              {error || "کسب‌وکار پیدا نشد"}
            </div>
          </div>
        </div>
        <BottomNav items={BOTTOM_NAV_ITEMS} activeNav={activeNav} onNavClick={handleNavClick} />
      </div>
    );
  }

  const primaryImage = business.images?.find((img) => img.is_primary) || business.images?.[0];
  const hasHours = !!(business.opening_time || business.closing_time);

  return (
    <div className="bdp-page lookavoo" dir="rtl">
      <div className="app-shell">
        <Sidebar items={SIDEBAR_NAV_ITEMS} activeNav={activeNav} onNavClick={handleNavClick} logoImg={logoImg} />
        <div className="main">
          <div className="bdp-topbar">
            <button className="bdp-back-btn" onClick={() => navigate(-1)} aria-label="بازگشت" title="بازگشت">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
               style={{ transform: "scaleX(-1)" }}
              >
           <path d="M15 18l-6-6 6-6" />
           </svg>
          </button>
            <div className="bdp-crumbs">
              {business.category?.name} <span className="sep">/</span> <b>{business.name}</b>
            </div>
            <button
              className="bdp-icon-btn theme-toggle-btn"
              onClick={toggleTheme}
              title="تغییر به حالت شب/روز"
            >
              {isDark ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 6.8 6.8 0 0 0 20 14.5Z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="4.2" />
                  <path d="M12 2.5v2.4M12 19v2.5M4.2 4.2l1.7 1.7M18 18l1.7 1.7M2.5 12h2.4M19 12h2.5M4.2 19.8l1.7-1.7M18 6l1.7-1.7" />
                </svg>
              )}
            </button>
            {/* آیکون سیو (بوکمارک) → وقتی saved باشه پررنگ (fill) می‌شه */}
{/* آیکون سیو (بوکمارک) → وقتی saved باشه پررنگ (fill) می‌شه */}
<button
  className={`bdp-icon-btn ${saved ? "is-active" : ""}`}
  onClick={handleToggleBookmark}
  disabled={bookmarkLoading}
  title={saved ? "حذف از بوکمارک‌ها" : "ذخیره در بوکمارک‌ها"}
>
  <svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <path d="M6 4h12v17l-6-4-6 4V4Z" />
  </svg>
</button>
<button className="bdp-icon-btn" onClick={handleShare} title="اشتراک‌گذاری">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="6" cy="12" r="2.2" />
    <circle cx="18" cy="6" r="2.2" />
    <circle cx="18" cy="18" r="2.2" />
    <path d="M8 11l8-4M8 13l8 4" />
  </svg>
</button>
          </div>

          <div className="content">
            <section className="cover">
              <div className="mesh">
                <span className="m1"></span>
                <span className="m2"></span>
              </div>
              {primaryImage ? (
                <img
                  src={`${API_URL}${primaryImage.image_url}`}
                  alt={business.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div className="cover-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M4 12a8 8 0 0 1 16 0v6H4v-6Z" />
                    <path d="M4 12h16" />
                  </svg>
                </div>
              )}
              {business.images?.length > 1 && (
                <div className="gallery-strip">
                  {business.images.slice(1, 3).map((img) => (
                    <div
                      key={img.id}
                      className="g-thumb"
                      style={{
                        backgroundImage: `url(${API_URL}${img.image_url})`,
                        backgroundSize: "cover",
                      }}
                    ></div>
                  ))}
                  {business.images.length > 3 && (
                    <div className="g-more">{persianDigits(business.images.length - 3)}+</div>
                  )}
                </div>
              )}
            </section>

            <section className="biz-header">
              <div className="biz-main">
                <div className="biz-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M4 12a8 8 0 0 1 16 0v6H4v-6Z" />
                    <path d="M4 12h16" />
                  </svg>
                </div>
                <div className="biz-info">
                  <h1>
                    {business.name}
                    <svg className="verified" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l2.4 2.1 3.1-.6 1 3 2.9 1.3-.6 3.2 1.9 2.5-1.9 2.5.6 3.2-2.9 1.3-1 3-3.1-.6L12 24l-2.4-2.1-3.1.6-1-3-2.9-1.3.6-3.2L1.3 12.5l1.9-2.5-.6-3.2 2.9-1.3 1-3 3.1.6L12 2Z" />
                    </svg>
                  </h1>
                  <div className="biz-meta-row">
                    <span className="tag-pill">{business.category?.name}</span>
                    <span className="rating-pill">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
                      </svg>
                      {persianDigits(business.avgRating || 0)}{" "}
                      <span className="count">({persianDigits(business.reviewsCount || 0)} نظر)</span>
                    </span>
                    {business.closing_time && (
                      <span className="status-pill">
                        <span className="dot"></span>
                        باز است تا {formatTime(business.closing_time)}
                      </span>
                    )}
                  </div>
                  <p className="biz-desc">{business.description}</p>
                </div>
              </div>
              <div className="biz-actions">
                <button
                  className="act-btn primary"
                  onClick={() => {
                    trackAction("call");
                    if (business.phone) {
                      window.location.href = `tel:${business.phone}`;
                    }
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2Z" />
                  </svg>
                  تماس با مغازه
                </button>
                <button
                  className="act-btn"
                  onClick={() => {
                    trackAction("route");
                    if (business.latitude && business.longitude) {
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`,
                        "_blank"
                      );
                    } else if (business.address) {
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`,
                        "_blank"
                      );
                    }
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" />
                    <circle cx="12" cy="10" r="2.4" />
                  </svg>
                  مسیریابی
                </button>

                <button className="act-btn icon-only">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="6" cy="12" r="2.2" />
                    <circle cx="18" cy="6" r="2.2" />
                    <circle cx="18" cy="18" r="2.2" />
                    <path d="M8 11l8-4M8 13l8 4" />
                  </svg>
                </button>
              </div>
            </section>

            {/* ================= تب‌ها: محصولات / اطلاعات / نظرات ================= */}
            <div className="tabs-container">
              {TAB_LIST.map((t) => (
                <button
                  key={t.key}
                  className={`tab ${activeTab === t.key ? "active" : ""}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* ---------------- تب محصولات ---------------- */}
            {activeTab === "products" && (
              <section className="tab-content active">
                <div className="section-header">
                  <h3 className="section-title">محصولات مغازه</h3>
                  <div className="filter-bar">
                    {PRODUCT_FILTERS.map((f) => (
                      <button
                        key={f.key}
                        className={`filter-chip ${productFilter === f.key ? "active" : ""}`}
                        onClick={() => setProductFilter(f.key)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="products-layout">
                  <div className="products-grid">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((p) => (
                        <div className="product-card" key={p.id} onClick={() => handleOrderProduct(p)}>
                          <div className="product-image">
                   {(p.image_url || p.image) ? (
  <img
src={
  (p.image_url || p.image || '').startsWith('http')
    ? (p.image_url || p.image)
    : `http://localhost:5000${p.image_url || p.image || ''}`
}
    alt={p.name}
    loading="lazy"
  />
) : (
                              <div className="product-image-fallback">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                                  <path d="M20 7 12 3 4 7l8 4 8-4Z" />
                                  <path d="M4 7v10l8 4 8-4V7" />
                                </svg>
                              </div>
                            )}
                            {p.badge && (
                              <span className={`product-badge ${p.badge === "تخفیف" ? "badge-sale" : "badge-new"}`}>
                                {p.badge}
                              </span>
                            )}
                          </div>
                          <div className="product-info">
                            <h4 className="product-name">{p.name}</h4>
                            {p.desc && <p className="product-desc">{p.desc}</p>}
                            <div className="product-price">
                              {formatPrice(p.price) && (
                                <span className="price-current">{formatPrice(p.price)} تومان</span>
                              )}
                              {formatPrice(p.oldPrice) && (
                                <span className="price-old">{formatPrice(p.oldPrice)} تومان</span>
                              )}
                            </div>
                            <button
                              className="btn-order"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOrderProduct(p);
                              }}
                            >
                              سفارش
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="products-empty">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <path d="M20 7 12 3 4 7l8 4 8-4Z" />
                          <path d="M4 7v10l8 4 8-4V7" />
                        </svg>
                        <p>هنوز محصولی برای این مغازه ثبت نشده است.</p>
                      </div>
                    )}
                  </div>

                  <aside className="contact-side">
                    <div className="cs-ico">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        <path d="M8 9h8M8 13h5" />
                      </svg>
                    </div>
                    <h3>ارتباط با فروشنده</h3>
                    <p>اگر درباره محصول، موجودی یا شرایط خرید سوالی داری، مستقیم برای فروشنده پیام بفرست.</p>
                    <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => goToChat()}>
                      پیام به فروشنده
                    </button>
                  </aside>
                </div>
              </section>
            )}

            {/* ---------------- تب اطلاعات ---------------- */}
            {activeTab === "info" && (
              <section className="tab-content active">
                <div className="info-card">
                  <h3 className="card-title">درباره کسب‌وکار</h3>
                  <p className="info-text">{business.description || "توضیحاتی برای این کسب‌وکار ثبت نشده است."}</p>
                </div>

                <div className="info-card">
                  <h3 className="card-title">اطلاعات</h3>
                  <div className="info-row">
                  </div>
                  <div className="info-row">
                    <div className="ir-ico">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div>
                      <span className="info-label">آدرس</span>
                      <span className="info-value">{business.address || "ثبت نشده"}</span>
                    </div>
                  </div>
                  {business.website && (
                    <div className="info-row">
                      <div className="ir-ico">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z" />
                        </svg>
                      </div>
                      <div>
                        <span className="info-label">وب‌سایت</span>
                        <span
                          className="info-value link"
                          onClick={() => window.open(business.website, "_blank")}
                        >
                          {business.website}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="info-card">
                  <h3 className="card-title">ساعات کاری</h3>
                  {hasHours ? (
                    <div className="hours-grid">
                      <div className="hours-row">
                        <b>امروز</b>
                        <span>
                          {formatTime(business.opening_time)} – {formatTime(business.closing_time)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="info-text">ساعات کاری ثبت نشده است.</p>
                  )}
                </div>

                {business.images?.length > 0 && (
                  <div className="info-card">
                    <h3 className="card-title">
                      گالری تصاویر
                      <span className="muted-count"> · {persianDigits(business.images.length)} تصویر</span>
                    </h3>
                    <div className="gal-grid">
                      {business.images.map((img) => (
                        <div
                          key={img.id}
                          className="gal-item"
                          style={{
                            backgroundImage: `url(${API_URL}${img.image_url})`,
                            backgroundSize: "cover",
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ---------------- تب نظرات ---------------- */}
            {activeTab === "reviews" && (
              <section className="tab-content active">
                <div className="reviews-summary">
                  <div className="rating-big">{persianDigits(business.avgRating || 0)}</div>
                  <div className="rating-stars">{paintStars(business.avgRating || 0, "lg")}</div>
                  <div className="rating-count">بر اساس {persianDigits(business.reviewsCount || 0)} نظر</div>
                </div>

                <div className="review-form">
                  <div className="star-picker">
                    {Array.from({ length: 5 }, (_, i) => {
                      const v = i + 1;
                      return (
                        <svg
                          key={v}
                          viewBox="0 0 24 24"
                          fill={v <= chosenRating ? "#FFB020" : "#D1D5DB"}
                          className={v <= chosenRating ? "on" : ""}
                          onClick={() => setChosenRating(v)}
                          style={{ cursor: "pointer" }}
                        >
                          <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
                        </svg>
                      );
                    })}
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="تجربه‌ی خود را بنویسید..."
                  />
                  {submitError && (
                    <p style={{ color: "#e11d48", fontSize: "13px", margin: "6px 0" }}>{submitError}</p>
                  )}
                  <div className="review-form-foot">
                    <button
                      className="submit-btn"
                      disabled={!(chosenRating > 0 && reviewText.trim().length > 3) || submitting}
                      onClick={submitReview}
                    >
                      {submitting ? "در حال ارسال..." : "ثبت نظر"}
                    </button>
                  </div>
                </div>

                <div className="reviews-list">
                  {business.reviews?.length > 0 ? (
                    business.reviews.map((r) => (
                      <div className="review-card" key={r.id}>
                        <div className="review-header">
                          <div
                            className="review-avatar"
                            style={{ background: avatarColors[r.id % avatarColors.length] }}
                          >
                            {(r.user?.name || "کاربر").trim()[0]}
                          </div>
                          <div>
                            <h4 className="review-name">{r.user?.name || "کاربر"}</h4>
                            <div className="review-stars">{paintStars(r.rating, "xs")}</div>
                          </div>
                          <span className="review-date">
                            {new Date(r.created_at).toLocaleDateString("fa-IR")}
                          </span>
                        </div>
                        <p className="review-text">{r.comment}</p>
                        {r.reply && (
                          <div className="seller-reply">
                            <div className="seller-reply-title">پاسخ فروشنده</div>
                            <p className="seller-reply-text">{r.reply}</p>
                            {r.replied_at && (
                              <div className="seller-reply-date">
                                {new Date(r.replied_at).toLocaleDateString("fa-IR")}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="info-text" style={{ textAlign: "center" }}>
                      هنوز نظری ثبت نشده. اولین نفر باش!
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* کسب‌وکارهای مشابه — خارج از تب‌ها */}
            {similar.length > 0 && (
              <div className="mini-card similar-card">
                <h4>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                  کسب‌وکارهای مشابه
                </h4>
                <div className="similar-grid">
                  {similar.map((item) => (
                    <div
                      className="mini-shop"
                      key={item.id}
                      onClick={() => navigate(`/business/${item.id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <div
                        className="m-ico"
                        style={{ background: "linear-gradient(135deg, #2547E8, #5271FF)" }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <path d="M4 12a8 8 0 0 1 16 0v6H4v-6Z" />
                          <path d="M4 12h16" />
                        </svg>
                      </div>
                      <div>
                        <b>{item.name}</b>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Footer />
        </div>
      </div>
      <BottomNav items={BOTTOM_NAV_ITEMS} activeNav={activeNav} onNavClick={handleNavClick} />
    </div>
  );
}