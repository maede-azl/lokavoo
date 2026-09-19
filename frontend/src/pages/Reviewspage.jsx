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
const ReviewIcon = ({ filled = false }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);
const StarIconOutline = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6">
    <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.6l-5.9 3 1.3-6.6-4.9-4.6 6.6-.8L12 2.5Z" />
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
const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6h12Z" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

function StarRating({ value }) {
  return (
    <div className="rev-stars" aria-label={`امتیاز ${value} از ۵`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIconOutline key={n} filled={n <= value} />
      ))}
    </div>
  );
}

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

/* ------------------------------------------------------------------ */
/* مودال ویرایش نظر                                                   */
/* ------------------------------------------------------------------ */
const EditReviewModal = ({ review, onClose, onSave }) => {
  const [localRating, setLocalRating] = useState(review?.rating || 5);
  const [comment, setComment] = useState(review?.comment || "");

  const handleStarClick = (value) => {
    setLocalRating(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...review,
      rating: localRating,
      comment: comment,
    });
  };

  return (
    <div className="edit-modal-overlay">
      <div className="edit-modal-content edit-modal-compact">
        <div className="modal-header">
          <h3>ویرایش نظر</h3>
          <button className="modal-close" onClick={onClose} aria-label="بستن">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>امتیاز (ستاره)</label>
              <div className="stars-input">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star ${star <= localRating ? "filled" : ""}`}
                    onClick={() => handleStarClick(star)}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>متن نظر</label>
              <textarea
                name="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="4"
                required
                placeholder="نظر خود را بنویسید..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              لغو
            </button>
            <button type="submit" className="btn-save">
              ذخیره تغییرات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function ReviewsPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const [activeNav, setActiveNav] = useState("reviews");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [hasOwnBusiness, setHasOwnBusiness] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
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

  // ===== گرفتن نظرات از بک‌اند =====
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/api/reviews/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          const mapped = json.data.map((r) => ({
            id: r.id,
            shopName: r.shopName || "بدون نام",
            productName: "",
            tag: r.tag || "",
            category: r.category || "all",
            color: "#2547E8",
            verified: false,
            rating: r.rating,
            comment: r.comment || "",
            address: "",
            date: relativeTime(r.createdAt),
            businessId: r.businessId,
          }));
          setReviews(mapped);
        }
      })
      .catch((err) => console.error("خطا در دریافت نظرات:", err))
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
    if (activeTab === "all") return reviews;
    return reviews.filter((item) => item.category === activeTab);
  }, [reviews, activeTab]);

  // تب‌ها را فقط از روی دسته‌بندی‌های واقعی نظرات بساز
  const dynamicTabs = useMemo(() => {
    const tabs = [{ key: "all", label: "همه" }];

    const seen = new Set();
    reviews.forEach((r) => {
      const cat = (r.category || "").trim();
      if (cat && cat !== "all" && !seen.has(cat)) {
        seen.add(cat);
        tabs.push({ key: cat, label: cat });
      }
    });

    return tabs;
  }, [reviews]);

  // ===== حذف نظر (وصل به بک‌اند) =====
  const removeReview = async (id) => {
    if (!window.confirm("آیا از حذف این نظر مطمئن هستید؟")) return;

    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/reviews/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();

      if (json.success) {
        setReviews((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert(json.message || "خطا در حذف نظر");
      }
    } catch (err) {
      console.error(err);
      alert("خطا در ارتباط با سرور");
    }
  };

  const editReview = (id) => {
    const review = reviews.find((r) => r.id === id);
    if (review) {
      setEditingReview(review);
    }
  };

  const closeModal = () => {
    setEditingReview(null);
  };

  // ===== ویرایش نظر (وصل به بک‌اند) =====
  const saveEditedReview = async (updatedReview) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/reviews/${updatedReview.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: updatedReview.rating,
          comment: updatedReview.comment,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === updatedReview.id
              ? {
                  ...r,
                  rating: json.data.rating,
                  comment: json.data.comment || "",
                }
              : r
          )
        );
        setEditingReview(null);
      } else {
        alert(json.message || "خطا در ویرایش نظر");
      }
    } catch (err) {
      console.error(err);
      alert("خطا در ارتباط با سرور");
    }
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
                      <ReviewIcon filled />
                    </span>
                    نظرات من
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
                در حال بارگذاری نظرات...
              </div>
            ) : filtered.length > 0 ? (
              <div className="rev-grid">
                {filtered.map((rv) => (
                  <div
                    className="rev-card"
                    key={rv.id}
                    onClick={(e) => {
                      if (e.target.closest(".rev-action-btn")) return;
                      navigate(`/businesses/${rv.businessId}`);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="rev-actions">
                      <button
                        className="rev-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          editReview(rv.id);
                        }}
                        aria-label="ویرایش نظر"
                        title="ویرایش نظر"
                      >
                        <EditIcon />
                      </button>
                      <button
                        className="rev-action-btn rev-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeReview(rv.id);
                        }}
                        aria-label="حذف نظر"
                        title="حذف نظر"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                    <div className="shop-media" style={{ background: rv.color }}>
                      <StoreIcon />
                    </div>
                    <div className="shop-body">
                      <div className="shop-name">
                        {rv.shopName}
                        {rv.verified && <BadgeCheckIcon />}
                      </div>
                      <div className="shop-tag">{rv.tag}</div>
                      {rv.productName && (
                        <div className="rev-product">
                          محصول: <span>{rv.productName}</span>
                        </div>
                      )}
                      <div className="shop-meta">
                        <StarRating value={rv.rating} />
                        <div className="fav-added-at">
                          <ClockIcon />
                          {rv.date}
                        </div>
                      </div>
                      <p className="rev-comment">{rv.comment}</p>
                      {rv.address && (
                        <div className="shop-addr">
                          <MapPinIcon /> {rv.address}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rev-empty">
                <div className="rev-empty-icon">
                  <ReviewIcon />
                </div>
                <h3>هنوز نظری ثبت نکرده‌اید</h3>
                <p>
                  بعد از خرید یا استفاده از خدمات فروشگاه‌ها، تجربه‌ی خودتون رو با ثبت نظر و امتیاز
                  با بقیه‌ی کاربران به اشتراک بذارید.
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

      {/* مودال ویرایش نظر */}
      {editingReview && (
        <EditReviewModal
          review={editingReview}
          onClose={closeModal}
          onSave={saveEditedReview}
        />
      )}
    </div>
  );
}