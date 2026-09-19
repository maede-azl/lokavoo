import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate, useParams } from "react-router-dom";

import "./BusinessDetailPage.css";

import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";

import {
  getSidebarItems,
  getBottomNavItems,
  getSellerMenuItem,
} from "../components/navConfig";

import { useTheme } from "../context/ThemeContext";

import logoBlack from "../assets/locavo-logo-black.png";
import logoWhite from "../assets/locavo-logo-white.png";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/* ============================================================
   Helpers
============================================================ */

const getToken = () => {
  return localStorage.getItem("token");
};

const persianDigits = (input) => {
  const map = {
    0: "۰",
    1: "۱",
    2: "۲",
    3: "۳",
    4: "۴",
    5: "۵",
    6: "۶",
    7: "۷",
    8: "۸",
    9: "۹",
  };

  return String(input).replace(
    /[0-9]/g,
    (d) => map[d]
  );
};

/*
 * تبدیل ساعت
 *
 * پشتیبانی از:
 * HH:mm
 * HH:mm:ss
 * ISO Date
 */
const formatTime = (time) => {
  if (!time) return null;

  if (typeof time === "string") {
    const match = time.match(
      /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
    );

    if (match) {
      const hh = match[1].padStart(2, "0");
      const mm = match[2];

      return persianDigits(`${hh}:${mm}`);
    }
  }

  const d = new Date(time);

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");

  return persianDigits(`${hh}:${mm}`);
};

const formatPrice = (n) => {
  if (
    n === null ||
    n === undefined ||
    n === ""
  ) {
    return null;
  }

  const num = Number(n);

  if (Number.isNaN(num)) {
    return null;
  }

  return persianDigits(
    num.toLocaleString("en-US")
  );
};

/*
 * ساخت URL صحیح برای تصویر
 */
const getImageUrl = (image) => {
  if (!image) return "";

  const value = String(image).trim();

  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  return `${API_URL}${
    value.startsWith("/") ? "" : "/"
  }${value}`;
};

/*
 * ساخت URL صحیح برای وب‌سایت
 */
const normalizeWebsiteUrl = (url) => {
  if (!url) return "";

  const value = String(url).trim();

  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  return `https://${value}`;
};

/* ============================================================
   Constants
============================================================ */

const avatarColors = [
  "#2547E8",
  "#16A34A",
  "#EC4899",
  "#FF9736",
  "#8B5CF6",
];

const TAB_LIST = [
  {
    key: "products",
    label: "محصولات",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M20 7 12 3 4 7l8 4 8-4Z" />
        <path d="M4 7v10l8 4 8-4V7M12 11v10" />
      </svg>
    ),
  },

  {
    key: "info",
    label: "اطلاعات",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
  },

  {
    key: "reviews",
    label: "نظرات",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
      </svg>
    ),
  },
];

const PRODUCT_FILTERS = [
  {
    key: "all",
    label: "همه",
  },
  {
    key: "newest",
    label: "جدیدترین",
  },
  {
    key: "top",
    label: "پرفروش‌ترین",
  },
  {
    key: "cheap",
    label: "ارزان‌ترین",
  },
];

/* ============================================================
   Component
============================================================ */

export default function BusinessDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    toggleTheme,
    isDark,
  } = useTheme();

  /* ==========================================================
     State
  ========================================================== */

  const [activeNav, setActiveNav] = useState("");

  const [saved, setSaved] = useState(false);

  const [bookmarkLoading, setBookmarkLoading] =
    useState(false);

  const [chosenRating, setChosenRating] =
    useState(0);

  const [reviewText, setReviewText] =
    useState("");

  const [business, setBusiness] =
    useState(null);

  const [similar, setSimilar] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [submitError, setSubmitError] =
    useState(null);

  const [activeTab, setActiveTab] =
    useState("products");

  const [productFilter, setProductFilter] =
    useState("all");

  const [authUser] = useState(() => {
    const savedUser =
      localStorage.getItem("user");

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  });

  const isLoggedIn = !!authUser;

  const [hasOwnBusiness, setHasOwnBusiness] =
    useState(false);

  const [checkingBusiness, setCheckingBusiness] =
    useState(true);

  /*
   * جلوگیری از ثبت چندباره View
   */
  const viewTrackedRef = useRef(null);

  /* ==========================================================
     Reviews visibility
  ========================================================== */

  const showReviews =
    business?.notif_review !== false;

  useEffect(() => {
    if (
      business &&
      !showReviews &&
      activeTab === "reviews"
    ) {
      setActiveTab("products");
    }
  }, [
    business,
    showReviews,
    activeTab,
  ]);

  /* ==========================================================
     Check seller business
  ========================================================== */

  useEffect(() => {
    if (
      !isLoggedIn ||
      authUser?.role !== "seller"
    ) {
      setCheckingBusiness(false);
      setHasOwnBusiness(false);
      return;
    }

    const token = getToken();

    if (!token) {
      setCheckingBusiness(false);
      setHasOwnBusiness(false);
      return;
    }

    let cancelled = false;

    setCheckingBusiness(true);

    fetch(`${API_URL}/api/businesses/mine`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        let data = {};

        try {
          data = await res.json();
        } catch {
          data = {};
        }

        if (!res.ok) {
          throw new Error(
            data.message ||
              "خطا در دریافت اطلاعات فروشنده"
          );
        }

        return data;
      })
      .then((data) => {
        if (cancelled) return;

        if (data.success) {
          setHasOwnBusiness(
            Number(data.count || 0) > 0
          );
        } else {
          setHasOwnBusiness(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(
            "خطا در بررسی کسب‌وکار فروشنده:",
            err
          );

          setHasOwnBusiness(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCheckingBusiness(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    isLoggedIn,
    authUser,
  ]);

  const sellerMenuItem =
    getSellerMenuItem(
      isLoggedIn,
      authUser,
      hasOwnBusiness
    );

  const SIDEBAR_NAV_ITEMS =
    getSidebarItems(
      sellerMenuItem,
      isLoggedIn
    );

  const BOTTOM_NAV_ITEMS =
    getBottomNavItems(
      sellerMenuItem,
      isLoggedIn
    );

  /* ==========================================================
     Bookmark status
  ========================================================== */

  useEffect(() => {
    if (
      !id ||
      !isLoggedIn
    ) {
      setSaved(false);
      return;
    }

    const token = getToken();

    if (!token) {
      setSaved(false);
      return;
    }

    let cancelled = false;

    fetch(
      `${API_URL}/api/bookmarks/${id}/status`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then(async (res) => {
        let json = {};

        try {
          json = await res.json();
        } catch {
          json = {};
        }

        if (!res.ok) {
          throw new Error(
            json.message ||
              "خطا در دریافت وضعیت بوکمارک"
          );
        }

        return json;
      })
      .then((json) => {
        if (
          !cancelled &&
          json.success
        ) {
          setSaved(
            Boolean(json.bookmarked)
          );
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(
            "خطا در دریافت وضعیت بوکمارک:",
            err
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    id,
    isLoggedIn,
  ]);

  /* ==========================================================
     Fetch business
  ========================================================== */

  useEffect(() => {
    let cancelled = false;

    const fetchBusiness = async () => {
      if (!id) {
        setError(
          "شناسه کسب‌وکار نامعتبر است"
        );

        setLoading(false);

        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${API_URL}/api/businesses/${id}`
        );

        let json = {};

        try {
          json = await res.json();
        } catch {
          throw new Error(
            "پاسخ نامعتبر از سرور دریافت شد"
          );
        }

        if (
          !res.ok ||
          !json.success
        ) {
          throw new Error(
            json.message ||
              "خطا در دریافت اطلاعات کسب‌وکار"
          );
        }

        if (cancelled) {
          return;
        }

        const currentBusiness =
          json.data;

        if (!currentBusiness) {
          throw new Error(
            "اطلاعات کسب‌وکار پیدا نشد"
          );
        }

        setBusiness(
          currentBusiness
        );

        /* ====================================================
           ثبت بازدید
        ==================================================== */

        const token = getToken();

        if (
          token &&
          viewTrackedRef.current !== id
        ) {
          viewTrackedRef.current = id;

          fetch(
            `${API_URL}/api/activity/view/${id}`,
            {
              method: "POST",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          ).catch((err) => {
            console.error(
              "خطا در ثبت بازدید:",
              err
            );
          });
        }

        /* ====================================================
           کسب‌وکارهای مشابه
        ==================================================== */

        const listRes =
          await fetch(
            `${API_URL}/api/businesses`
          );

        let listJson = {};

        try {
          listJson =
            await listRes.json();
        } catch {
          listJson = {};
        }

        if (
          !cancelled &&
          listRes.ok &&
          listJson.success &&
          Array.isArray(
            listJson.data
          )
        ) {
          const sameCategory =
            listJson.data
              .filter(
                (b) =>
                  b.category_id ===
                    currentBusiness.category_id &&
                  b.id !==
                    currentBusiness.id
              )
              .slice(0, 2);

          setSimilar(
            sameCategory
          );
        } else {
          setSimilar([]);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(
            "خطا در دریافت کسب‌وکار:",
            err
          );

          setError(
            err.message ||
              "خطا در دریافت اطلاعات"
          );

          setBusiness(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchBusiness();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /* ==========================================================
     Stars
  ========================================================== */

  const paintStars = (
    value,
    size = "sm"
  ) => {
    const rounded = Math.round(
      Number(value) || 0
    );

    return Array.from(
      {
        length: 5,
      },
      (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          fill={
            i < rounded
              ? "#FFB020"
              : "#D1D5DB"
          }
          className={`${
            i < rounded
              ? "on"
              : ""
          } star-${size}`}
        >
          <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
        </svg>
      )
    );
  };

  /* ==========================================================
     Submit review
  ========================================================== */

  const submitReview = async () => {
    if (!showReviews) {
      return;
    }

    if (
      !(
        chosenRating > 0 &&
        reviewText.trim().length > 3
      )
    ) {
      return;
    }

    const token = getToken();

    if (!token) {
      setSubmitError(
        "برای ثبت نظر باید وارد حساب کاربری خود شوید"
      );

      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(
        `${API_URL}/api/reviews/business/${id}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            rating: chosenRating,
            comment:
              reviewText.trim(),
          }),
        }
      );

      let json = {};

      try {
        json = await res.json();
      } catch {
        throw new Error(
          "پاسخ نامعتبر از سرور دریافت شد"
        );
      }

      if (
        !res.ok ||
        !json.success
      ) {
        throw new Error(
          json.message ||
            "ثبت نظر با خطا مواجه شد"
        );
      }

      setBusiness((prev) => {
        if (!prev) {
          return prev;
        }

        const newReview =
          json.data;

        if (!newReview) {
          return prev;
        }

        const oldReviews =
          Array.isArray(
            prev.reviews
          )
            ? prev.reviews
            : [];

        const otherReviews =
          oldReviews.filter(
            (r) =>
              r.id !==
              newReview.id
          );

        const updatedReviews = [
          newReview,
          ...otherReviews,
        ];

        const avg =
          updatedReviews.length >
          0
            ? updatedReviews.reduce(
                (
                  sum,
                  r
                ) =>
                  sum +
                  Number(
                    r.rating || 0
                  ),
                0
              ) /
              updatedReviews.length
            : 0;

        return {
          ...prev,

          reviews:
            updatedReviews,

          reviewsCount:
            updatedReviews.length,

          avgRating:
            Number(
              avg.toFixed(1)
            ),
        };
      });

      setChosenRating(0);
      setReviewText("");
    } catch (err) {
      console.error(
        "خطا در ثبت نظر:",
        err
      );

      setSubmitError(
        err.message ||
          "ثبت نظر با خطا مواجه شد"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ==========================================================
     Track actions
  ========================================================== */

  const trackAction = async (
    type
  ) => {
    if (!id) {
      return;
    }

    try {
      await fetch(
        `${API_URL}/api/businesses/${id}/track`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            type,
          }),
        }
      );
    } catch (err) {
      console.error(
        "خطا در ثبت آمار:",
        err
      );
    }
  };

  /* ==========================================================
     Bookmark
  ========================================================== */

  const handleToggleBookmark =
    async () => {
      const token = getToken();

      if (!token) {
        navigate("/auth");
        return;
      }

      if (
        bookmarkLoading ||
        !id
      ) {
        return;
      }

      setBookmarkLoading(true);

      const previousSaved =
        saved;

      setSaved(
        (value) => !value
      );

      try {
        const res = await fetch(
          `${API_URL}/api/bookmarks/${id}/toggle`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        let json = {};

        try {
          json = await res.json();
        } catch {
          json = {};
        }

        if (
          !res.ok ||
          !json.success
        ) {
          throw new Error(
            json.message ||
              "خطا در بوکمارک"
          );
        }

        setSaved(
          Boolean(
            json.bookmarked
          )
        );
      } catch (err) {
        console.error(
          "خطا در بوکمارک:",
          err
        );

        setSaved(
          previousSaved
        );
      } finally {
        setBookmarkLoading(
          false
        );
      }
    };

  /* ==========================================================
     Share
  ========================================================== */

  const handleShare =
    async () => {
      const url =
        window.location.href;

      if (
        navigator.share
      ) {
        try {
          await navigator.share(
            {
              title:
                business?.name ||
                "کسب‌وکار",

              url,
            }
          );
        } catch {
          // کاربر اشتراک‌گذاری را لغو کرده است
        }

        return;
      }

      try {
        if (
          navigator.clipboard
        ) {
          await navigator.clipboard.writeText(
            url
          );
        }
      } catch (err) {
        console.error(
          "خطا در کپی لینک:",
          err
        );
      }
    };

  /* ==========================================================
     Navigation
  ========================================================== */

  const logoImg = isDark
    ? logoWhite
    : logoBlack;

  const handleNavClick =
    (item) => {
      setActiveNav(
        item.key
      );

      if (item.path) {
        navigate(
          item.path
        );
      }
    };

  /* ==========================================================
     Chat with seller
  ========================================================== */

  const goToChat = async (
    extra = {}
  ) => {
    if (!business) {
      return;
    }

    const token =
      getToken();

    if (!token) {
      navigate("/auth");
      return;
    }

    try {
      trackAction(
        "message"
      );

      const res =
        await fetch(
          `${API_URL}/api/messages/business/${business.id}/start`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              ...(extra.productName
                ? {
                    productName:
                      extra.productName,
                  }
                : {}),
            }),
          }
        );

      let json = {};

      try {
        json = await res.json();
      } catch {
        json = {};
      }

      if (
        !res.ok ||
        !json.success
      ) {
        throw new Error(
          json.message ||
            "خطا در ایجاد گفتگو"
        );
      }

      navigate(
        "/my-chats",
        {
          state: {
            conversationId:
              json.data?.id,

            businessId:
              business.id,
          },
        }
      );
    } catch (err) {
      console.error(
        "خطا در چت با فروشنده:",
        err
      );

      navigate(
        "/my-chats"
      );
    }
  };

  /* ==========================================================
     Order product
  ========================================================== */

  const handleOrderProduct =
    (product) => {
      trackAction(
        "order"
      );

      // اگر کسب‌وکار وب‌سایت داشته باشد، سفارش مستقیماً به سایت خودش لینک می‌شود
      if (
        business?.website &&
        String(business.website).trim()
      ) {
        const url =
          /^https?:\/\//i.test(business.website)
            ? business.website
            : `https://${business.website}`;

        window.open(
          url,
          "_blank",
          "noopener,noreferrer"
        );
        return;
      }

      goToChat({
        productName:
          product?.name,
      });
    };

  /* ==========================================================
     Products
  ========================================================== */

  const products =
    Array.isArray(
      business?.products
    )
      ? business.products
      : [];

  const filteredProducts =
    useMemo(() => {
      let list = [
        ...products,
      ];

      if (
        productFilter ===
        "newest"
      ) {
        list =
          list
            .slice()
            .reverse();
      }

      if (
        productFilter ===
        "top"
      ) {
        list =
          list
            .slice()
            .sort(
              (a, b) =>
                (Number(
                  b.sales
                ) || 0) -
                (Number(
                  a.sales
                ) || 0)
            );
      }

      if (
        productFilter ===
        "cheap"
      ) {
        list =
          list
            .slice()
            .sort(
              (a, b) =>
                (Number(
                  a.price
                ) || 0) -
                (Number(
                  b.price
                ) || 0)
            );
      }

      return list;
    }, [
      products,
      productFilter,
    ]);

  /* ==========================================================
     Loading
  ========================================================== */

  if (loading) {
    return (
      <div
        className="bdp-page lookavoo"
        dir="rtl"
      >
        <div className="app-shell">
          <Sidebar
            items={
              SIDEBAR_NAV_ITEMS
            }
            activeNav={
              activeNav
            }
            onNavClick={
              handleNavClick
            }
            logoImg={
              logoImg
            }
          />

          <div className="main">
            <div className="bdp-skeleton-wrap">
              <div className="lk-skeleton bdp-skel-hero" />
              <div className="bdp-skel-header-row">
                <div className="lk-skeleton bdp-skel-avatar" />
                <div className="bdp-skel-lines">
                  <div className="lk-skeleton bdp-skel-line" style={{ width: "60%", height: 22 }} />
                  <div className="lk-skeleton bdp-skel-line" style={{ width: "40%", height: 14 }} />
                </div>
              </div>
              <div className="bdp-skel-grid">
                <div className="lk-skeleton bdp-skel-card" />
                <div className="lk-skeleton bdp-skel-card" />
                <div className="lk-skeleton bdp-skel-card" />
              </div>
            </div>
          </div>
        </div>

        <BottomNav
          items={
            BOTTOM_NAV_ITEMS
          }
          activeNav={
            activeNav
          }
          onNavClick={
            handleNavClick
          }
        />
      </div>
    );
  }

  /* ==========================================================
     Error
  ========================================================== */

  if (
    error ||
    !business
  ) {
    return (
      <div
        className="bdp-page lookavoo"
        dir="rtl"
      >
        <div className="app-shell">
          <Sidebar
            items={
              SIDEBAR_NAV_ITEMS
            }
            activeNav={
              activeNav
            }
            onNavClick={
              handleNavClick
            }
            logoImg={
              logoImg
            }
          />

          <div className="main">
            <div
              className="content"
              style={{
                padding:
                  "40px",
                textAlign:
                  "center",
              }}
            >
              {error ||
                "کسب‌وکار پیدا نشد"}
            </div>
          </div>
        </div>

        <BottomNav
          items={
            BOTTOM_NAV_ITEMS
          }
          activeNav={
            activeNav
          }
          onNavClick={
            handleNavClick
          }
        />
      </div>
    );
  }

  /* ==========================================================
     Business data
  ========================================================== */

  const primaryImage =
    business.images?.find(
      (img) =>
        img.is_primary
    ) ||
    business.images?.[0];

  const hasHours = Boolean(
    business.opening_time ||
      business.closing_time
  );

  /* ==========================================================
     Render
  ========================================================== */

  return (
    <div
      className="bdp-page lookavoo"
      dir="rtl"
    >
      <div className="app-shell">
        <Sidebar
          items={
            SIDEBAR_NAV_ITEMS
          }
          activeNav={
            activeNav
          }
          onNavClick={
            handleNavClick
          }
          logoImg={
            logoImg
          }
        />

        <div className="main">

          {/* ==================================================
              TOP BAR
          ================================================== */}

          <div className="bdp-topbar">

            <button
              className="bdp-back-btn"
              onClick={() =>
                navigate(-1)
              }
              aria-label="بازگشت"
              title="بازگشت"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  transform:
                    "scaleX(-1)",
                }}
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <div className="bdp-crumbs">
              {
                business.category
                  ?.name
              }

              <span className="sep">
                /
              </span>

              <b>
                {
                  business.name
                }
              </b>
            </div>

            <button
              className="bdp-icon-btn theme-toggle-btn"
              onClick={
                toggleTheme
              }
              title="تغییر به حالت شب/روز"
            >
              {isDark ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 6.8 6.8 0 0 0 20 14.5Z" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="4.2"
                  />

                  <path d="M12 2.5v2.4M12 19v2.5M4.2 4.2l1.7 1.7M18 18l1.7 1.7M2.5 12h2.4M19 12h2.5M4.2 19.8l1.7-1.7M18 6l1.7-1.7" />
                </svg>
              )}
            </button>

            <button
              className={`bdp-icon-btn ${
                saved
                  ? "is-active"
                  : ""
              }`}
              onClick={
                handleToggleBookmark
              }
              disabled={
                bookmarkLoading
              }
              title={
                saved
                  ? "حذف از بوکمارک‌ها"
                  : "ذخیره در بوکمارک‌ها"
              }
            >
              <svg
                viewBox="0 0 24 24"
                fill={
                  saved
                    ? "currentColor"
                    : "none"
                }
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 4h12v17l-6-4-6 4V4Z" />
              </svg>
            </button>

            <button
              className="bdp-icon-btn"
              onClick={
                handleShare
              }
              title="اشتراک‌گذاری"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle
                  cx="6"
                  cy="12"
                  r="2.2"
                />

                <circle
                  cx="18"
                  cy="6"
                  r="2.2"
                />

                <circle
                  cx="18"
                  cy="18"
                  r="2.2"
                />

                <path d="M8 11l8-4M8 13l8 4" />
              </svg>
            </button>
          </div>

          <div className="content">

            {/* =================================================
                COVER
            ================================================= */}

            <section className="cover">

              <div className="mesh">
                <span className="m1"></span>
                <span className="m2"></span>
              </div>

              {primaryImage ? (
                <img
                  src={getImageUrl(
                    primaryImage.image_url
                  )}
                  alt={
                    business.name
                  }
                  style={{
                    width:
                      "100%",
                    height:
                      "100%",
                    objectFit:
                      "cover",
                  }}
                />
              ) : (
                <div className="cover-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <path d="M4 12a8 8 0 0 1 16 0v6H4v-6Z" />
                    <path d="M4 12h16" />
                  </svg>
                </div>
              )}

              {business.images?.length >
                1 && (
                <div className="gallery-strip">

                  {business.images
                    .slice(1, 3)
                    .map(
                      (img) => (
                        <div
                          key={
                            img.id
                          }
                          className="g-thumb"
                          style={{
                            backgroundImage: `url("${getImageUrl(
                              img.image_url
                            )}")`,

                            backgroundSize:
                              "cover",

                            backgroundPosition:
                              "center",
                          }}
                        />
                      )
                    )}

                  {business.images.length >
                    3 && (
                    <div className="g-more">
                      {
                        persianDigits(
                          business
                            .images
                            .length -
                            3
                        )
                      }
                      +
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* =================================================
                BUSINESS HEADER
            ================================================= */}

            <section className="biz-header">

              <div className="biz-main">

                <div className="biz-avatar">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <path d="M4 12a8 8 0 0 1 16 0v6H4v-6Z" />
                    <path d="M4 12h16" />
                  </svg>
                </div>

                <div className="biz-info">

                  <h1>
                    {
                      business.name
                    }

                    <svg
                      className="verified"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2l2.4 2.1 3.1-.6 1 3 2.9 1.3-.6 3.2 1.9 2.5-1.9 2.5.6 3.2-2.9 1.3-1 3-3.1-.6L12 24l-2.4-2.1-3.1.6-1-3-2.9-1.3.6-3.2L1.3 12.5l1.9-2.5-.6-3.2 2.9-1.3 1-3 3.1.6L12 2Z" />
                    </svg>
                  </h1>

                  <div className="biz-meta-row">

                    <span className="tag-pill">
                      {
                        business
                          .category
                          ?.name
                      }
                    </span>

                    {showReviews && (
                      <span className="rating-pill">

                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
                        </svg>

                        {persianDigits(
                          business.avgRating ||
                            0
                        )}

                        <span className="count">
                          (
                          {
                            persianDigits(
                              business
                                .reviewsCount ||
                                0
                            )
                          }{" "}
                          نظر)
                        </span>
                      </span>
                    )}

                    {business.closing_time && (
                      <span className="status-pill">
                        <span className="dot"></span>

                        باز است تا{" "}

                        {
                          formatTime(
                            business.closing_time
                          )
                        }
                      </span>
                    )}

                  </div>

                  <p className="biz-desc">
                    {
                      business.description
                    }
                  </p>

                </div>
              </div>

              {/* =================================================
                  BUSINESS ACTIONS
              ================================================= */}

              <div className="biz-actions">

                {business.show_phone !==
                  false &&
                  business.phone && (
                    <button
                      className="act-btn primary"
                      onClick={() => {
                        trackAction(
                          "call"
                        );

                        window.location.href =
                          `tel:${business.phone}`;
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2Z" />
                      </svg>

                      تماس با مغازه
                    </button>
                  )}

                <button
                  className="act-btn"
                  onClick={() => {
                    trackAction(
                      "route"
                    );

                    if (
                      business.latitude &&
                      business.longitude
                    ) {
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`,
                        "_blank",
                        "noopener,noreferrer"
                      );
                    } else if (
                      business.address
                    ) {
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          business.address
                        )}`,
                        "_blank",
                        "noopener,noreferrer"
                      );
                    }
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" />
                    <circle
                      cx="12"
                      cy="10"
                      r="2.4"
                    />
                  </svg>

                  مسیریابی
                </button>

                <button
                  className="act-btn icon-only"
                  onClick={
                    handleShare
                  }
                  title="اشتراک‌گذاری"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle
                      cx="6"
                      cy="12"
                      r="2.2"
                    />

                    <circle
                      cx="18"
                      cy="6"
                      r="2.2"
                    />

                    <circle
                      cx="18"
                      cy="18"
                      r="2.2"
                    />

                    <path d="M8 11l8-4M8 13l8 4" />
                  </svg>
                </button>

              </div>
            </section>

            {/* =================================================
                TABS
            ================================================= */}

            <div className="tabs-container">

              {TAB_LIST
                .filter(
                  (tab) =>
                    tab.key !==
                      "reviews" ||
                    showReviews
                )
                .map(
                  (tab) => (
                    <button
                      key={
                        tab.key
                      }
                      className={`tab ${
                        activeTab ===
                        tab.key
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        setActiveTab(
                          tab.key
                        )
                      }
                    >
                      {
                        tab.icon
                      }

                      {
                        tab.label
                      }
                    </button>
                  )
                )}

            </div>

            {/* =================================================
                PRODUCTS
            ================================================= */}

            {activeTab ===
              "products" && (
              <section className="tab-content active">

                <div className="section-header">

                  <h3 className="section-title">
                    محصولات مغازه
                  </h3>

                  <div className="filter-bar">

                    {PRODUCT_FILTERS.map(
                      (filter) => (
                        <button
                          key={
                            filter.key
                          }
                          className={`filter-chip ${
                            productFilter ===
                            filter.key
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            setProductFilter(
                              filter.key
                            )
                          }
                        >
                          {
                            filter.label
                          }
                        </button>
                      )
                    )}

                  </div>
                </div>

                <div className="products-layout">

                  <div className="products-grid">

                    {filteredProducts.length >
                    0 ? (
                      filteredProducts.map(
                        (product) => {

                          const productImage =
                            product.image_url ||
                            product.image;

                          return (
                            <div
                              className="product-card"
                              key={
                                product.id
                              }
                              onClick={() =>
                                handleOrderProduct(
                                  product
                                )
                              }
                            >

                              <div className="product-image">

                                {productImage ? (
                                  <img
                                    src={getImageUrl(
                                      productImage
                                    )}
                                    alt={
                                      product.name ||
                                      "محصول"
                                    }
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="product-image-fallback">
                                    <svg
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.6"
                                    >
                                      <path d="M20 7 12 3 4 7l8 4 8-4Z" />
                                      <path d="M4 7v10l8 4 8-4V7" />
                                    </svg>
                                  </div>
                                )}

                                {product.badge && (
                                  <span
                                    className={`product-badge ${
                                      product.badge ===
                                      "تخفیف"
                                        ? "badge-sale"
                                        : "badge-new"
                                    }`}
                                  >
                                    {
                                      product.badge
                                    }
                                  </span>
                                )}

                              </div>

                              <div className="product-info">

                                <h4 className="product-name">
                                  {
                                    product.name
                                  }
                                </h4>

                                {product.desc && (
                                  <p className="product-desc">
                                    {
                                      product.desc
                                    }
                                  </p>
                                )}

                                <div className="product-price">

                                  {formatPrice(
                                    product.price
                                  ) && (
                                    <span className="price-current">
                                      {
                                        formatPrice(
                                          product.price
                                        )
                                      }{" "}
                                      تومان
                                    </span>
                                  )}

                                  {formatPrice(
                                    product.oldPrice
                                  ) && (
                                    <span className="price-old">
                                      {
                                        formatPrice(
                                          product.oldPrice
                                        )
                                      }{" "}
                                      تومان
                                    </span>
                                  )}

                                </div>

                                <button
                                  className="btn-order"
                                  onClick={(
                                    e
                                  ) => {
                                    e.stopPropagation();

                                    handleOrderProduct(
                                      product
                                    );
                                  }}
                                >
                                  سفارش
                                </button>

                              </div>

                            </div>
                          );
                        }
                      )
                    ) : (
                      <div className="products-empty">

                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        >
                          <path d="M20 7 12 3 4 7l8 4 8-4Z" />
                          <path d="M4 7v10l8 4 8-4V7" />
                        </svg>

                        <p>
                          هنوز محصولی
                          برای این مغازه
                          ثبت نشده است.
                        </p>

                      </div>
                    )}

                  </div>

                  <aside className="contact-side">

                    <div className="cs-ico">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        <path d="M8 9h8M8 13h5" />
                      </svg>
                    </div>

                    <h3>
                      ارتباط با فروشنده
                    </h3>

                    <p>
                      اگر درباره محصول،
                      موجودی یا شرایط خرید
                      سوالی داری، مستقیم
                      برای فروشنده پیام
                      بفرست.
                    </p>

                    <button
                      className="btn btn-primary"
                      style={{
                        width:
                          "100%",
                      }}
                      onClick={() =>
                        goToChat()
                      }
                    >
                      پیام به فروشنده
                    </button>

                  </aside>

                </div>
              </section>
            )}

            {/* =================================================
                INFO
            ================================================= */}

            {activeTab ===
              "info" && (
              <section className="tab-content active">

                <div className="info-card">

                  <h3 className="card-title">
                    درباره کسب‌وکار
                  </h3>

                  <p className="info-text">
                    {
                      business.description ||
                      "توضیحاتی برای این کسب‌وکار ثبت نشده است."
                    }
                  </p>

                </div>

                <div className="info-card">

                  <h3 className="card-title">
                    اطلاعات
                  </h3>

                  <div className="info-row">

                    <div className="ir-ico">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle
                          cx="12"
                          cy="10"
                          r="3"
                        />
                      </svg>
                    </div>

                    <div>

                      <span className="info-label">
                        آدرس
                      </span>

                      <span className="info-value">
                        {
                          business.address ||
                          "ثبت نشده"
                        }
                      </span>

                    </div>
                  </div>

                  {business.website && (
                    <div className="info-row">

                      <div className="ir-ico">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                          />
                          <path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z" />
                        </svg>
                      </div>

                      <div>

                        <span className="info-label">
                          وب‌سایت
                        </span>

                        <span
                          className="info-value link"
                          onClick={() =>
                            window.open(
                              normalizeWebsiteUrl(
                                business.website
                              ),
                              "_blank",
                              "noopener,noreferrer"
                            )
                          }
                        >
                          {
                            business.website
                          }
                        </span>

                      </div>

                    </div>
                  )}

                </div>

                <div className="info-card">

                  <h3 className="card-title">
                    ساعات کاری
                  </h3>

                  {hasHours ? (
                    <div className="hours-grid">

                      <div className="hours-row">

                        <b>
                          امروز
                        </b>

                        <span>
                          {
                            formatTime(
                              business.opening_time
                            )
                          }

                          {" – "}

                          {
                            formatTime(
                              business.closing_time
                            )
                          }
                        </span>

                      </div>

                    </div>
                  ) : (
                    <p className="info-text">
                      ساعات کاری
                      ثبت نشده است.
                    </p>
                  )}

                </div>

                {business.images?.length >
                  0 && (
                  <div className="info-card">

                    <h3 className="card-title">

                      گالری تصاویر

                      <span className="muted-count">
                        {" · "}

                        {
                          persianDigits(
                            business
                              .images
                              .length
                          )
                        }

                        {" "}
                        تصویر
                      </span>

                    </h3>

                    <div className="gal-grid">

                      {business.images.map(
                        (img) => (
                          <div
                            key={
                              img.id
                            }
                            className="gal-item"
                            style={{
                              backgroundImage: `url("${getImageUrl(
                                img.image_url
                              )}")`,

                              backgroundSize:
                                "cover",

                              backgroundPosition:
                                "center",
                            }}
                          />
                        )
                      )}

                    </div>

                  </div>
                )}

              </section>
            )}

            {/* =================================================
                REVIEWS
            ================================================= */}

            {activeTab ===
              "reviews" &&
              showReviews && (
                <section className="tab-content active">

                  <div className="reviews-summary">

                    <div className="rating-big">
                      {
                        persianDigits(
                          business.avgRating ||
                            0
                        )
                      }
                    </div>

                    <div className="rating-stars">
                      {
                        paintStars(
                          business.avgRating ||
                            0,
                          "lg"
                        )
                      }
                    </div>

                    <div className="rating-count">
                      بر اساس{" "}

                      {
                        persianDigits(
                          business.reviewsCount ||
                            0
                        )
                      }

                      {" "}
                      نظر
                    </div>

                  </div>

                  <div className="review-form">

                    <div className="star-picker">

                      {Array.from(
                        {
                          length: 5,
                        },
                        (_, i) => {
                          const value =
                            i + 1;

                          return (
                            <svg
                              key={
                                value
                              }
                              viewBox="0 0 24 24"
                              fill={
                                value <=
                                chosenRating
                                  ? "#FFB020"
                                  : "#D1D5DB"
                              }
                              className={
                                value <=
                                chosenRating
                                  ? "on"
                                  : ""
                              }
                              onClick={() =>
                                setChosenRating(
                                  value
                                )
                              }
                              style={{
                                cursor:
                                  "pointer",
                              }}
                            >
                              <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
                            </svg>
                          );
                        }
                      )}

                    </div>

                    <textarea
                      value={
                        reviewText
                      }
                      onChange={(
                        e
                      ) =>
                        setReviewText(
                          e.target
                            .value
                        )
                      }
                      placeholder="تجربه‌ی خود را بنویسید..."
                    />

                    {submitError && (
                      <p
                        style={{
                          color:
                            "#e11d48",
                          fontSize:
                            "13px",
                          margin:
                            "6px 0",
                        }}
                      >
                        {
                          submitError
                        }
                      </p>
                    )}

                    <div className="review-form-foot">

                      <button
                        className="submit-btn"
                        disabled={
                          !(
                            chosenRating >
                              0 &&
                            reviewText
                              .trim()
                              .length >
                              3
                          ) ||
                          submitting
                        }
                        onClick={
                          submitReview
                        }
                      >
                        {submitting
                          ? "در حال ارسال..."
                          : "ثبت نظر"}
                      </button>

                    </div>

                  </div>

                  <div className="reviews-list">

                    {business.reviews
                      ?.length >
                    0 ? (
                      business.reviews.map(
                        (review) => (
                          <div
                            className="review-card"
                            key={
                              review.id
                            }
                          >

                            <div className="review-header">

                              <div
                                className="review-avatar"
                                style={{
                                  background:
                                    avatarColors[
                                      Math.abs(
                                        Number(
                                          review.id
                                        ) || 0
                                      ) %
                                        avatarColors.length
                                    ],
                                }}
                              >
                                {(
                                  review
                                    .user
                                    ?.name ||
                                  "کاربر"
                                )
                                  .trim()
                                  .charAt(
                                    0
                                  )}
                              </div>

                              <div>

                                <h4 className="review-name">
                                  {
                                    review
                                      .user
                                      ?.name ||
                                    "کاربر"
                                  }
                                </h4>

                                <div className="review-stars">
                                  {
                                    paintStars(
                                      review.rating,
                                      "xs"
                                    )
                                  }
                                </div>

                              </div>

                              <span className="review-date">
                                {
                                  review.created_at
                                    ? new Date(
                                        review.created_at
                                      ).toLocaleDateString(
                                        "fa-IR"
                                      )
                                    : ""
                                }
                              </span>

                            </div>

                            <p className="review-text">
                              {
                                review.comment
                              }
                            </p>

                            {review.reply && (
                              <div className="seller-reply">

                                <div className="seller-reply-title">
                                  پاسخ فروشنده
                                </div>

                                <p className="seller-reply-text">
                                  {
                                    review.reply
                                  }
                                </p>

                                {review.replied_at && (
                                  <div className="seller-reply-date">
                                    {
                                      new Date(
                                        review.replied_at
                                      ).toLocaleDateString(
                                        "fa-IR"
                                      )
                                    }
                                  </div>
                                )}

                              </div>
                            )}

                          </div>
                        )
                      )
                    ) : (
                      <p
                        className="info-text"
                        style={{
                          textAlign:
                            "center",
                        }}
                      >
                        هنوز نظری ثبت
                        نشده. اولین نفر
                        باش!
                      </p>
                    )}

                  </div>

                </section>
              )}

            {/* =================================================
                SIMILAR BUSINESSES
            ================================================= */}

            {similar.length >
              0 && (
              <div className="mini-card similar-card">

                <h4>

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect
                      x="3"
                      y="3"
                      width="7"
                      height="7"
                    />

                    <rect
                      x="14"
                      y="3"
                      width="7"
                      height="7"
                    />

                    <rect
                      x="3"
                      y="14"
                      width="7"
                      height="7"
                    />

                    <rect
                      x="14"
                      y="14"
                      width="7"
                      height="7"
                    />
                  </svg>

                  کسب‌وکارهای مشابه

                </h4>

                <div className="similar-grid">

                  {similar.map(
                    (item) => (
                      <div
                        className="mini-shop"
                        key={
                          item.id
                        }
                        onClick={() =>
                          navigate(
                            `/businesses/${item.id}`
                          )
                        }
                        style={{
                          cursor:
                            "pointer",
                        }}
                      >

                        <div
                          className="m-ico"
                          style={{
                            background:
                              "linear-gradient(135deg, #2547E8, #5271FF)",
                          }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                          >
                            <path d="M4 12a8 8 0 0 1 16 0v6H4v-6Z" />
                            <path d="M4 12h16" />
                          </svg>
                        </div>

                        <div>
                          <b>
                            {
                              item.name
                            }
                          </b>
                        </div>

                      </div>
                    )
                  )}

                </div>

              </div>
            )}

          </div>

          <Footer />

        </div>
      </div>

      <BottomNav
        items={
          BOTTOM_NAV_ITEMS
        }
        activeNav={
          activeNav
        }
        onNavClick={
          handleNavClick
        }
      />

    </div>
  );
}