import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "./CategoryPage.css";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import { getSidebarItems, getBottomNavItems, getSellerMenuItem } from "../components/navConfig";
import { useTheme } from "../context/ThemeContext";
import logoBlack from "../assets/locavo-logo-black.png";
import logoWhite from "../assets/locavo-logo-white.png";

const API_BASE = "http://localhost:5000";

const CATEGORY_META = {
  bakery: {
    title: "نانوایی و شیرینی",
    subtitle: "نان، شیرینی و کافه نان نزدیک شما",
  },
  cafe: {
    title: "کافه و رستوران",
    subtitle: "غذا، نوشیدنی و کافه‌های نزدیک شما",
  },
  auto: {
    title: "خدمات خودرو",
    subtitle: "تعمیر، سرویس و خدمات خودرویی",
  },
  beauty: {
    title: "سلامت و زیبایی",
    subtitle: "آرایشگاه‌ها و خدمات زیبایی",
  },
  education: {
    title: "خدمات آموزشی",
    subtitle: "آموزشگاه‌ها و مراکز آموزشی",
  },
  medical: {
    title: "خدمات پزشکی",
    subtitle: "کلینیک‌ها، پزشکان و خدمات درمانی",
  },
  more: {
    title: "بیشتر",
    subtitle: "سایر دسته‌بندی‌ها",
  },
};

export default function CategoryPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const meta = CATEGORY_META[slug] || CATEGORY_META.more;
  const sortRef = useRef(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("categories");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [categoryInfo, setCategoryInfo] = useState(null);

  const sortOptions = [
    { id: "relevance", label: "مرتبط‌ترین" },
    { id: "rating", label: "بالاترین امتیاز" },
    { id: "dist", label: "نزدیک‌ترین" },
    { id: "new", label: "جدیدترین" },
  ];

  const [search, setSearch] = useState("");
  const [state, setState] = useState({
    subs: new Set(),
    openOnly: false,
    minRate: 0,
    maxDist: 99,
    amenities: new Set(),
    sort: "relevance",
    view: "grid",
  });

  const amenityFilters = ["ارسال", "کارتی", "پارکینگ"];
  const distanceFilters = [
    { text: "همه شهر", value: 99 },
    { text: "۵۰۰ متر", value: 0.5 },
    { text: "۱ کیلومتر", value: 1 },
    { text: "۲ کیلومتر", value: 2 },
  ];
  const rateFilters = [4.8, 4.5, 4];

  // دریافت داده از بک‌اند
  useEffect(() => {
    if (!slug || slug === "more") {
      setBusinesses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/businesses/category/${slug}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setCategoryInfo(json.category);
          setBusinesses(json.data || []);
        } else {
          setError(json.message || "خطا در دریافت داده‌ها");
          setBusinesses([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("خطا در اتصال به سرور");
        setBusinesses([]);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // تبدیل داده‌های بک‌اند به فرمت مورد نیاز کامپوننت
  const data = useMemo(() => {
    return businesses.map((b) => {
      const primaryImage = b.images?.find((img) => img.is_primary) || b.images?.[0];
      const colors = [
        b.category?.color_1 || "#2547E8",
        b.category?.color_2 || "#5271FF",
      ];
      let open = true;
      if (b.opening_time && b.closing_time) {
        open = true;
      }
      return {
        id: b.id,
        name: b.name,
        sub: b.category?.name || "کسب‌وکار",
        rating: b.avgRating || 0,
        reviewsCount: b.reviewsCount || 0,
        dist: 1.0,
        open,
        verified: b.status === "approved",
        ribbon: null,
        colors,
        amenities: [],
        addr: b.address || "آدرس ثبت نشده",
        image: primaryImage ? `${API_BASE}${primaryImage.image_url}` : null,
        description: b.description,
      };
    });
  }, [businesses]);

  const starIcon = `<path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/>`;
  const bakeryIcon = `<path d="M4 12a8 8 0 0 1 16 0v6H4v-6Z"/><path d="M4 12h16"/>`;

  useEffect(() => {
    function handleClickOutside(e) {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sortLabels = {
    relevance: "مرتبط‌ترین",
    rating: "بالاترین امتیاز",
    dist: "نزدیک‌ترین",
    new: "جدیدترین",
  };

  const fmtDist = (d) =>
    d < 1 ? `${Math.round(d * 1000)} متر` : `${d.toFixed(1).replace(".0", "")} کیلومتر`;

  const matches = (s) => {
    if (search && !s.name.includes(search) && !s.sub.includes(search)) return false;
    if (state.openOnly && !s.open) return false;
    if (s.rating < state.minRate) return false;
    if (s.dist > state.maxDist) return false;
    for (const a of state.amenities) if (!s.amenities.includes(a)) return false;
    return true;
  };

  const sortShops = (list) => {
    const l = [...list];
    if (state.sort === "rating") l.sort((a, b) => b.rating - a.rating);
    else if (state.sort === "dist") l.sort((a, b) => a.dist - b.dist);
    else if (state.sort === "new") l.reverse();
    return l;
  };

  const filtered = sortShops(data.filter(matches));

  const resetAll = () => {
    setSearch("");
    setState({
      subs: new Set(),
      openOnly: false,
      minRate: 0,
      maxDist: 99,
      amenities: new Set(),
      sort: "relevance",
      view: "grid",
    });
  };

  const toggleAmenity = (item) => {
    const amenities = new Set(state.amenities);
    if (amenities.has(item)) amenities.delete(item);
    else amenities.add(item);
    setState({ ...state, amenities });
  };

  const removeChip = (type, value) => {
    if (type === "amenity") {
      const amenities = new Set(state.amenities);
      amenities.delete(value);
      setState({ ...state, amenities });
    }
  };

  const activeChips = [
    ...Array.from(state.amenities).map((v) => ({ type: "amenity", value: v })),
  ];

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
    const token = localStorage.getItem("token");
    setCheckingBusiness(true);
    fetch(`${API_BASE}/api/businesses/mine`, {
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
  const sidebarItems = getSidebarItems(sellerMenuItem, isLoggedIn);
  const bottomNavItems = getBottomNavItems(sellerMenuItem, isLoggedIn);
  const logo = isDark ? logoWhite : logoBlack;

  const handleNavClick = (item) => {
    setActiveNav(item.key);
    if (item.path) navigate(item.path);
  };

  return (
    <div className="cat-page lookavoo" dir="rtl" lang="fa">
      <div className="app-shell">
        <Sidebar
          items={sidebarItems}
          activeNav={activeNav}
          logoImg={logo}
          logoAlt="لوکاوو"
          onNavClick={handleNavClick}
        />
        <div className="main">
        <section className="cat-hero">
            <div className="mesh">
              <span className="m1"></span>
              <span className="m2"></span>
            </div>

            <div className="cat-crumbs-row">
              <img src={logo} alt="لوکاوو" className="cat-mobile-logo-inline" />
              <button className="cat-back-btn" onClick={() => navigate(-1)} title="بازگشت">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
              <button
                className="cat-back-btn"
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
              <div className="cat-crumbs">
                <Link to="/">خانه</Link> <span>/</span>{" "}
                <Link to="/">دسته‌بندی‌ها</Link> <span>/</span> <b>{meta.title}</b>
              </div>
            </div>
            <div className="cat-top">
              <div className="cat-title-wrap">
                <div className="cat-icon-big">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M4 12a8 8 0 0 1 16 0v6H4v-6Z" />
                    <path d="M4 12h16" />
                  </svg>
                </div>
                <div>
                  <h1>{meta.title}</h1>
                  <p>{meta.subtitle}</p>
                </div>
              </div>
            </div>
          </section>

          <div className="control-bar">
            <div className="sort-wrap" ref={sortRef}>
              <button
                type="button"
                className={`sort-select ${sortOpen ? "open" : ""}`}
                onClick={() => setSortOpen((o) => !o)}
              >
                <span>{sortLabels[state.sort]}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div className={`sort-menu ${sortOpen ? "open" : ""}`}>
                {sortOptions.map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    className={state.sort === opt.id ? "active" : ""}
                    onClick={() => {
                      setState((p) => ({ ...p, sort: opt.id }));
                      setSortOpen(false);
                    }}
                  >
                    <span>{opt.label}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
            <div className="view-toggle">
              <button
                className={state.view === "grid" ? "active" : ""}
                onClick={() => setState((p) => ({ ...p, view: "grid" }))}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </button>
              <button
                className={state.view === "list" ? "active" : ""}
                onClick={() => setState((p) => ({ ...p, view: "list" }))}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {activeChips.length > 0 && (
            <div className="active-chips">
              {activeChips.map((c) => (
                <span className="active-chip" key={`${c.type}-${c.value}`}>
                  {c.value}
                  <button onClick={() => removeChip(c.type, c.value)}>✕</button>
                </span>
              ))}
            </div>
          )}

          <div className="body-grid">
            <aside className="filters">
              <div className="filters-head">
                <h3>فیلترها</h3>
                <button className="reset-link" onClick={resetAll}>
                  پاک‌کردن همه
                </button>
              </div>
              <div className="f-group">
                <h4>وضعیت</h4>
                <div className="toggle-row">
                  <span>فقط بازها</span>
                  <div
                    className={`switch ${state.openOnly ? "on" : ""}`}
                    role="switch"
                    aria-checked={state.openOnly}
                    tabIndex={0}
                    onClick={() => setState((p) => ({ ...p, openOnly: !p.openOnly }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setState((p) => ({ ...p, openOnly: !p.openOnly }));
                      }
                    }}
                  ></div>
                </div>
              </div>
              <div className="f-group">
                <h4>حداقل امتیاز</h4>
                <div className="rate-row">
                  <label className={`rate-opt ${state.minRate === 0 ? "on" : ""}`}>
                    <input
                      type="radio"
                      name="rate"
                      checked={state.minRate === 0}
                      onChange={() => setState((p) => ({ ...p, minRate: 0 }))}
                    />
                    <span>همه امتیازها</span>
                  </label>
                  {rateFilters.map((r) => (
                    <label key={r} className={`rate-opt ${state.minRate === r ? "on" : ""}`}>
                      <input
                        type="radio"
                        name="rate"
                        checked={state.minRate === r}
                        onChange={() => setState((p) => ({ ...p, minRate: r }))}
                      />
                      <span className="stars-mini">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d={starIcon} />
                        </svg>
                      </span>
                      <span>{r} به بالا</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="f-group">
                <h4>فاصله</h4>
                <div className="f-chip-grid">
                  {distanceFilters.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      className={`f-chip ${state.maxDist === d.value ? "on" : ""}`}
                      onClick={() => setState((p) => ({ ...p, maxDist: d.value }))}
                    >
                      {d.text}
                    </button>
                  ))}
                </div>
              </div>
              <div className="f-group">
                <h4>امکانات</h4>
                <div className="amenity-list">
                  {amenityFilters.map((a) => (
                    <label key={a} className="amenity">
                      <input
                        type="checkbox"
                        checked={state.amenities.has(a)}
                        onChange={() => toggleAmenity(a)}
                      />
                      <span>{a}</span>
                    </label>
                  ))}
                </div>
              </div>
            </aside>

            <div className="results-col">
              <div className="results-head">
                <div className="results-count">
                  {loading ? (
                    "در حال بارگذاری..."
                  ) : (
                    <>
                      <b id="countNum">{filtered.length.toLocaleString("fa-IR")}</b> نتیجه پیدا شد
                    </>
                  )}
                </div>
              </div>
              <div className={`results-grid ${state.view === "list" ? "list-view" : ""}`}>
                {loading ? (
                  <div className="empty-state">
                    <h4>در حال دریافت اطلاعات...</h4>
                  </div>
                ) : error ? (
                  <div className="empty-state">
                    <h4>{error}</h4>
                    <p>لطفاً دوباره تلاش کنید.</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="empty-state">
                    <div className="e-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-4.3-4.3" />
                      </svg>
                    </div>
                    <h4>نتیجه‌ای پیدا نشد</h4>
                    <p>هیچ کسب‌وکاری در این دسته‌بندی پیدا نشد یا فیلترها خیلی محدود هستند.</p>
                    <button onClick={resetAll}>پاک‌کردن فیلترها</button>
                  </div>
                ) : (
                  filtered.map((s, i) => (
                    <a
                      className="shop-card"
                      style={{
                        "--glow-color": `${s.colors[0]}40`,
                        animationDelay: `${i * 0.05}s`,
                      }}
                      href={`/businesses/${s.id}`}
                      key={s.id}
                    >
                      <div
                        className="shop-media"
                        style={{
                          background: s.image
                            ? `url(${s.image}) center/cover`
                            : `linear-gradient(135deg,${s.colors[0]},${s.colors[1]})`,
                        }}
                      >
                        <span className={`shop-badge ${s.open ? "open" : "closed"}`}>
                          {s.open ? "باز است" : "بسته"}
                        </span>
                        {s.ribbon ? <span className="shop-ribbon">{s.ribbon}</span> : null}
                        {!s.image && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <path d={bakeryIcon} />
                          </svg>
                        )}
                      </div>
                      <div className="shop-body">
                        <div>
                          <div className="shop-name">
                            {s.name}
                            {s.verified ? (
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2l2.4 2.1 3.1-.6 1 3 2.9 1.3-.6 3.2 1.9 2.5-1.9 2.5.6 3.2-2.9 1.3-1 3-3.1-.6L12 24l-2.4-2.1-3.1.6-1-3-2.9-1.3.6-3.2L1.3 12.5l1.9-2.5-.6-3.2 2.9-1.3 1-3 3.1.6L12 2Z" />
                              </svg>
                            ) : null}
                          </div>
                          <div className="shop-tag">
                            {s.sub} · {fmtDist(s.dist)}
                          </div>
                        </div>
                        <div className="shop-meta">
                          <span className="rating">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d={starIcon} />
                            </svg>{" "}
                            {s.rating > 0 ? s.rating : "بدون امتیاز"}
                          </span>
                          <span>مشاهده →</span>
                        </div>
                        <div className="shop-addr">{s.addr}</div>
                      </div>
                    </a>
                  ))
                )}
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>
      <BottomNav items={bottomNavItems} activeNav={activeNav} onNavClick={handleNavClick} />
    </div>
  );
}