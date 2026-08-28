import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./HomePage.css";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import { getSellerMenuItem, getSidebarItems, getBottomNavItems } from "./components/navConfig";
import logoBlack from "./assets/locavo-logo-black.png";
import logoWhite from "./assets/locavo-logo-white.png";

const API_BASE = "http://localhost:5000";
const CAT_COLLAPSED_COUNT = 5;

/* آیکون‌های خطی (SVG path) دقیقاً مطابق نسخه‌ی HTML — بدون ایموجی */
const catIconPaths = {
  hotel: `<path d="M3 19v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8"/><path d="M3 14h18"/><path d="M7 14v-2a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v2"/><path d="M3 19v2M21 19v2"/>`,
  restaurant: `<path d="M6 2v8a2 2 0 0 0 2 2v10"/><path d="M6 2v6M9 2v6"/><path d="M17 2c-2.2 0-3 3-3 6.5S15 13 17 13v9"/>`,
  cafe: `<path d="M6 2v8a2 2 0 0 0 2 2v10"/><path d="M6 2v6M9 2v6"/><path d="M17 2c-2.2 0-3 3-3 6.5S15 13 17 13v9"/>`,
  beauty: `<circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><path d="M20 4L8.5 15.5M20 20L8.5 8.5"/>`,
  salon: `<circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><path d="M20 4L8.5 15.5M20 20L8.5 8.5"/>`,
  medical: `<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>`,
  doctor: `<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>`,
  pharmacy: `<rect x="2" y="9" width="20" height="6" rx="3"/><path d="M12 9v6"/>`,
  shopping: `<path d="M8 3l4 2 4-2 4 4-3 3v10H7V10L4 7Z"/>`,
  sport: `<path d="M4 9v6M2 10v4M20 9v6M22 10v4"/><path d="M7 12h10"/>`,
  gym: `<path d="M4 9v6M2 10v4M20 9v6M22 10v4"/><path d="M7 12h10"/>`,
  car: `<path d="M3 13l2-6h14l2 6"/><rect x="3" y="13" width="18" height="6" rx="1"/><circle cx="7.5" cy="19" r="1.5"/><circle cx="16.5" cy="19" r="1.5"/>`,
  repair: `<path d="M14 7l3 3-8 8-3-3 8-8Z"/><path d="M17 4l3 3-2 2-3-3 2-2Z"/>`,
  food: `<circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M2 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L21 7H6"/>`,
  default: `<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>`,
};

const getCategoryIconPaths = (keyName) => catIconPaths[keyName] || catIconPaths.default;

function CountUpStat({ target }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) {
      setValue(0);
      return;
    }
    let cur = 0;
    const step = Math.max(target / 40, 1);
    let raf;
    const tick = () => {
      cur += step;
      if (cur >= target) {
        setValue(Math.round(target).toLocaleString("fa-IR"));
        return;
      }
      setValue(Math.round(cur).toLocaleString("fa-IR"));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return <span>{value}</span>;
}

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [activeNav, setActiveNav] = useState("home");
  const [query, setQuery] = useState("");
  const [shops, setShops] = useState([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
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
  const [selectedProvince, setSelectedProvince] = useState(() => localStorage.getItem("selectedProvince") || "تهران");
  const [selectedCity, setSelectedCity] = useState(() => localStorage.getItem("selectedCity") || "تهران");

  useEffect(() => {
    fetch(`${API_BASE}/api/businesses`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setShops(data.data);
      })
      .catch((err) => console.error("خطا در دریافت کسب‌وکارها:", err))
      .finally(() => setLoadingShops(false));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategories(data.data);
      })
      .catch((err) => console.error("خطا در دریافت دسته‌بندی‌ها:", err))
      .finally(() => setLoadingCategories(false));
  }, []);

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

  useEffect(() => {
    localStorage.setItem("selectedProvince", selectedProvince);
    localStorage.setItem("selectedCity", selectedCity);
  }, [selectedProvince, selectedCity]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const timer = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => clearTimeout(timer);
  }, [location.hash, loadingShops]);

  const sellerMenuItem = getSellerMenuItem(isLoggedIn, authUser, hasOwnBusiness);
  const SIDEBAR_NAV_ITEMS = getSidebarItems(sellerMenuItem, isLoggedIn);
  const BOTTOM_NAV_ITEMS = getBottomNavItems(sellerMenuItem, isLoggedIn);
  const logoImg = theme === "dark" ? logoWhite : logoBlack;
  const heroFeatured = shops.slice(0, 2);
  const visibleCategories = categories.slice(0, CAT_COLLAPSED_COUNT);

  const handleProvinceChange = (newProvince, firstCity) => {
    setSelectedProvince(newProvince);
    setSelectedCity(firstCity);
  };

  const handleSearch = () => {
    const q = query.trim();
    const cityParam = selectedCity ? `&city=${encodeURIComponent(selectedCity)}` : "";
    navigate(q ? `/search?q=${encodeURIComponent(q)}${cityParam}` : `/search?city=${encodeURIComponent(selectedCity)}`);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleAuthToggle = () => {
    if (isLoggedIn) {
      if (window.confirm("آیا مطمئن هستید که می‌خواهید خارج شوید؟")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setAuthUser(null);
      }
    } else {
      navigate("/auth");
    }
  };

  const handleNavClick = (item) => {
    setActiveNav(item.key);
    if (item.path) navigate(item.path);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div className={`lookavoo theme-${theme}`}>
      <div className="app-shell">
        <Sidebar items={SIDEBAR_NAV_ITEMS} activeNav={activeNav} onNavClick={handleNavClick} logoImg={logoImg} />
        <div className="main">
          <Header
            logoImg={logoImg}
            isLoggedIn={isLoggedIn}
            onAuthToggle={handleAuthToggle}
            query={query}
            onQueryChange={setQuery}
            onSearch={handleSearch}
            onSearchKeyDown={handleSearchKeyDown}
            selectedProvince={selectedProvince}
            selectedCity={selectedCity}
            onProvinceChange={handleProvinceChange}
            onCityChange={setSelectedCity}
            theme={theme}
            onThemeToggle={toggleTheme}
          />
          <div className="content">
            <section className="hero">
              <div className="mesh">
                <span className="m1"></span>
                <span className="m2"></span>
              </div>
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="pulse"></span>
                  بیش از <CountUpStat target={shops.length} /> کسب‌وکار فعال
                </div>
                <h1>
                  هر صنفی که بخوای، <span>اینجا</span> پیداش کن
                </h1>
                <p>
                  از نانوایی تا دفتر وکالت — همه‌ی کسب‌وکارهای شهر، با آدرس دقیق و نظر واقعی مشتری‌ها، در یک جا.
                </p>
              </div>
              <div className="hero-visual">
                <div className="float-card">
                  <div className="fc-search">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="7" />
                      <path d="M21 21l-4.3-4.3" />
                    </svg>
                    نزدیک من
                  </div>
                  {heroFeatured.length === 0 ? (
                    <div className="fc-row">
                      <div className="fc-info">
                        <span>{loadingShops ? "در حال بارگذاری..." : "هنوز کسب‌وکاری ثبت نشده"}</span>
                      </div>
                    </div>
                  ) : (
                    heroFeatured.map((s) => (
                      <div className="fc-row" key={s.id}>
                        <div className="fc-ico" style={{ background: "linear-gradient(135deg,#2547E8,#5271FF)" }}>
                          {s.category && s.category.icon ? s.category.icon : "🏪"}
                        </div>
                        <div className="fc-info">
                          <b>{s.name}</b>
                          <span>{s.address || "آدرس ثبت نشده"}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="badge-verified">✓ تایید شده توسط لوکاوو</div>
              </div>
            </section>

            {/* ============ CATEGORIES ============ */}
            <section>
              <div className="section-head">
                <h2>دسته‌بندی‌ها</h2>
                <button
                  type="button"
                  className="section-link"
                  onClick={() => navigate("/categories")}
                >
                  مشاهده همه
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
              </div>

              {loadingCategories ? (
                <p>در حال بارگذاری دسته‌بندی‌ها...</p>
              ) : categories.length === 0 ? (
                <p>هنوز دسته‌بندی‌ای ثبت نشده است.</p>
              ) : (
                <div className="cat-grid">
                  {visibleCategories.map((c, i) => (
                    <div
                      className="cat-card"
                      key={c.id}
                      style={{ "--cat-color": c.color_1 || "#2563eb", "--i": i }}
                      onClick={() => navigate(`/category/${c.key_name || c.id}`)}
                    >
                      <div className="cat-watermark" aria-hidden="true">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          dangerouslySetInnerHTML={{ __html: getCategoryIconPaths(c.key_name) }}
                        />
                      </div>
                      <div className="cat-icon-badge">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          dangerouslySetInnerHTML={{ __html: getCategoryIconPaths(c.key_name) }}
                        />
                      </div>
                      <span>{c.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
            {/* ============ LATEST ============ */}
            <section id="latest-shops">
              <div className="section-head">
                <h2>تازه‌ترین‌ها</h2>
              </div>
              <div className="results-grid">
                {loadingShops ? (
                  <p>در حال بارگذاری...</p>
                ) : shops.length === 0 ? (
                  <p>هنوز کسب‌وکاری ثبت نشده است.</p>
                ) : (
                  shops.map((s) => (
                    <div
                      className="shop-card"
                      key={s.id}
                      style={{ "--glow-color": "#2547E840", cursor: "pointer" }}
                      onClick={() => navigate(`/businesses/${s.id}`)}
                    >
                      <div
                        className="shop-media"
                        style={{
                          background:
                            s.images && s.images.length > 0
                              ? `url(${API_BASE}${s.images[0].image_url}) center/cover`
                              : "linear-gradient(135deg,#2547E8,#5271FF)",
                        }}
                      >
                        <span className="shop-badge">تایید شده</span>
                        {(!s.images || s.images.length === 0) && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l1-5h16l1 5" />
                            <path d="M4 9v10h16V9" />
                            <path d="M9 21v-6h6v6" />
                          </svg>
                        )}
                      </div>
                      <div className="shop-body">
                        <div>
                          <div className="shop-name">{s.name}</div>
                          <div className="shop-tag">{s.category ? s.category.name : ""}</div>
                        </div>
                        <div className="shop-meta">
                          <span style={{ direction: "ltr" }}>{s.phone}</span>
                          <span>مشاهده →</span>
                        </div>
                        <div className="shop-addr">{s.address}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
          <Footer />
        </div>
      </div>
      <BottomNav items={BOTTOM_NAV_ITEMS} activeNav={activeNav} onNavClick={handleNavClick} />
      {/* دکمه شناور پشتیبانی */}
      <button
        type="button"
        className="support-fab"
        onClick={() => navigate("/my-chats")}
        aria-label="پشتیبانی"
      >
        <span className="fab-pulse"></span>
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M4 13a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <rect x="2.5" y="12" width="4" height="6" rx="2" fill="currentColor" />
          <rect x="17.5" y="12" width="4" height="6" rx="2" fill="currentColor" />
          <circle cx="12" cy="15" r="5" fill="#fff" />
          <circle cx="9.8" cy="15" r="1" fill="currentColor" />
          <circle cx="12" cy="15" r="1" fill="currentColor" />
          <circle cx="14.2" cy="15" r="1" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}