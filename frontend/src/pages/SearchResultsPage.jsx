import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./SearchResultsPage.css";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import { getSidebarItems, getBottomNavItems, getSellerMenuItem } from "../components/navConfig";
import { useTheme } from "../context/ThemeContext";
import logoBlack from "../assets/locavo-logo-black.png";
import logoWhite from "../assets/locavo-logo-white.png";

const API_BASE = "http://localhost:5000";

/* ============ ICONS ============ */
const STAR_PATH = "M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z";
const ICONS = {
  bakery: <><path d="M4 12a8 8 0 0 1 16 0v6H4v-6Z" /><path d="M4 12h16" /></>,
  cafe: <><path d="M4 9h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" /><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" /><path d="M8 3c0 1-1 1-1 2s1 1 1 2M12 3c0 1-1 1-1 2s1 1 1 2" /></>,
  auto: <><path d="M5 17h14M6 17l1.2-6.5A2 2 0 0 1 9.2 9h5.6a2 2 0 0 1 2 1.5L18 17" /><circle cx="7.5" cy="17" r="1.6" /><circle cx="16.5" cy="17" r="1.6" /></>,
  beauty: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
};

const CAT_META = {
  bakery: { label: "نانوایی و شیرینی", colors: ["#FF7A45", "#FFC24B"] },
  cafe: { label: "کافه و رستوران", colors: ["#8B5CF6", "#EC4899"] },
  auto: { label: "خدمات خودرو", colors: ["#2547E8", "#5271FF"] },
  beauty: { label: "سلامت و زیبایی", colors: ["#16A34A", "#5EEAD4"] }
};

const TRENDING = ["سنگک", "کافه دنج", "تعویض روغن", "آرایشگاه زنانه", "کیک تولد"];
const SORT_LABELS = { relevance: "مرتبط‌ترین", rating: "بالاترین امتیاز", dist: "نزدیک‌ترین", new: "جدیدترین" };

/* ============ HELPERS ============ */
function fmtDist(d) {
  if (d == null || d >= 99) return "—";
  return d < 1 ? Math.round(d * 1000) + " متر" : d.toFixed(1).replace(".0", "") + " کیلومتر";
}

function highlight(text, q) {
  if (!q || !text) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export default function SearchResultsPage() {
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const initialCity = searchParams.get("city") || "";

  const [filters, setFilters] = useState({
  search: initialQuery.trim(),
  city: initialCity,  
  cat: "all",
    openOnly: false,
    minRate: 0,
    maxDist: 99,
    amenities: new Set(),
    sort: "relevance",
    view: "grid"
  });

  const [query, setQuery] = useState(initialQuery);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [hiIndex, setHiIndex] = useState(-1);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [heroCompact, setHeroCompact] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [displayList, setDisplayList] = useState([]);
  const [rtime, setRtime] = useState("");
  const [displayCount, setDisplayCount] = useState(0);
  const [ripples, setRipples] = useState([]);
  const [activeChipsLeaving, setActiveChipsLeaving] = useState({});
  const [activeNav, setActiveNav] = useState(null);
  const [userLocation, setUserLocation] = useState({ lat: null, lng: null });
  const [suggestions, setSuggestions] = useState({ shops: [], cats: Object.entries(CAT_META) });

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

  const bigSearchRef = useRef(null);
  const goBtnRef = useRef(null);
  const pingTimerRef = useRef(null);
  const renderTokenRef = useRef(0);
  const tabRefs = useRef({});
  const tabIndicatorRef = useRef(null);
  const resultTabsRef = useRef(null);
  const suggestAbortRef = useRef(null);
  const lastLoggedSearchRef = useRef(null);

  const logSearch = useCallback((q) => {
  const trimmed = q.trim();
  if (!trimmed || trimmed === lastLoggedSearchRef.current) return;
  lastLoggedSearchRef.current = trimmed;

  const token = localStorage.getItem("token");
  if (!token) return;
  fetch(`${API_BASE}/api/activity/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query: trimmed }),
  }).catch((err) => console.error("خطا در ثبت جستجو:", err));
}, []);

  // گرفتن موقعیت کاربر
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        // اگر کاربر اجازه نداد، فاصله نمایش داده نمی‌شه
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  // چک کسب‌وکار فروشنده
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

  // همگام‌سازی URL با سرچ
useEffect(() => {
  const urlQuery = searchParams.get("q") || "";
  const urlCity = searchParams.get("city") || "";
  if (urlQuery.trim() !== filters.search || urlCity !== filters.city) {
    setQuery(urlQuery);
    setFilters((f) => ({ ...f, search: urlQuery.trim(), city: urlCity }));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [searchParams]);

// ثبت جستجو برای هر q معتبر که توی URL هست (چه موقع mount چه بعداً)
useEffect(() => {
  const urlQuery = searchParams.get("q") || "";
  logSearch(urlQuery);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [searchParams]);

  // محاسبه تعداد هر تب (فعلاً ساده)
  const tabCounts = useMemo(() => {
    const counts = { all: displayList.length };
    Object.keys(CAT_META).forEach((c) => {
      counts[c] = displayList.filter((s) => s.cat === c).length;
    });
    return counts;
  }, [displayList]);

  const positionIndicator = useCallback(() => {
    const btn = tabRefs.current[filters.cat];
    const wrap = resultTabsRef.current;
    if (!btn || !wrap || !tabIndicatorRef.current) return;
    tabIndicatorRef.current.style.width = btn.offsetWidth + "px";
    const isRtl = document.dir === "rtl";
    tabIndicatorRef.current.style.transform = `translateX(${isRtl ? -btn.offsetLeft : btn.offsetLeft}px)`;
  }, [filters.cat]);

  useLayoutEffect(() => {
    positionIndicator();
  }, [positionIndicator]);

  useEffect(() => {
    window.addEventListener("resize", positionIndicator);
    return () => window.removeEventListener("resize", positionIndicator);
  }, [positionIndicator]);

  useEffect(() => {
    const onScroll = () => setHeroCompact(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      if (bigSearchRef.current && !bigSearchRef.current.contains(e.target)) {
        setSuggestOpen(false);
        setSearchFocused(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    const onDocClick = () => setSortOpen(false);
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // ========== اصلی‌ترین بخش: فراخوانی API سرچ ==========
  useEffect(() => {
    const token = ++renderTokenRef.current;
    setLoading(true);
    setRtime("");

    const controller = new AbortController();
    const t0 = performance.now();

    const params = new URLSearchParams();
if (filters.search) params.set("q", filters.search);
if (filters.city) params.set("city", filters.city);   // ← جدید
if (filters.cat !== "all") params.set("category", filters.cat);
    if (filters.openOnly) params.set("openOnly", "true");
    if (filters.minRate > 0) params.set("minRate", filters.minRate);
    if (filters.maxDist < 99) params.set("maxDist", filters.maxDist);
    if (filters.sort) params.set("sort", filters.sort);
    if (userLocation.lat && userLocation.lng) {
      params.set("lat", userLocation.lat);
      params.set("lng", userLocation.lng);
    }

    fetch(`${API_BASE}/api/businesses/search?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (token !== renderTokenRef.current) return;
        if (data.success) {
          setDisplayList(data.data || []);
          const ms = Math.max(performance.now() - t0, 12).toFixed(0);
          setRtime(`${ms} میلی‌ثانیه`);
        } else {
          setDisplayList([]);
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.error("Search error:", err);
        setDisplayList([]);
      })
      .finally(() => {
        if (token === renderTokenRef.current) setLoading(false);
      });

    return () => controller.abort();
  }, [
    filters.search,
    filters.cat,
    filters.openOnly,
    filters.minRate,
    filters.maxDist,
    filters.sort,
    userLocation.lat,
    userLocation.lng,
  ]);

  // انیمیشن شمارنده نتایج
  useEffect(() => {
    if (loading) return;
    const target = displayList.length;
    let cur = 0;
    const step = Math.max(target / 16, 0.3);
    let raf;
    const tick = () => {
      cur += step;
      if (cur >= target) {
        setDisplayCount(target);
        return;
      }
      setDisplayCount(Math.round(cur));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [loading, displayList.length]);

  // پیشنهادات سرچ (debounced)
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions({ shops: [], cats: Object.entries(CAT_META) });
      return;
    }

    if (suggestAbortRef.current) suggestAbortRef.current.abort();
    const controller = new AbortController();
    suggestAbortRef.current = controller;

    const timer = setTimeout(() => {
      const params = new URLSearchParams({ q: query.trim(), limit: 8 });
      if (userLocation.lat && userLocation.lng) {
        params.set("lat", userLocation.lat);
        params.set("lng", userLocation.lng);
      }

      fetch(`${API_BASE}/api/businesses/search?${params.toString()}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setSuggestions({
              shops: data.data || [],
              cats: [],
            });
          }
        })
        .catch(() => {});
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, userLocation.lat, userLocation.lng]);

const commitSearch = useCallback(
  (val) => {
    const trimmed = val.trim();
    setQuery(val);
    setFilters((f) => ({ ...f, search: trimmed }));
    setSuggestOpen(false);
    setSearchFocused(false);
    setSearchActive(false);
    setSearchParams(trimmed ? { q: trimmed } : {}, { replace: true });

    logSearch(trimmed);
  },
  [setSearchParams, logSearch]
);

  const resetAll = useCallback(() => {
    setFilters((f) => ({
      ...f,
      openOnly: false,
      minRate: 0,
      maxDist: 99,
      amenities: new Set(),
    }));
  }, []);

  const onSearchInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSuggestOpen(true);
    setHiIndex(-1);
    setSearchActive(true);
    clearTimeout(pingTimerRef.current);
    pingTimerRef.current = setTimeout(() => setSearchActive(false), 900);
  };

  const onSearchKeyDown = (e) => {
    const items = suggestions.shops;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHiIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHiIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (hiIndex >= 0 && items[hiIndex]) commitSearch(items[hiIndex].name);
      else commitSearch(query);
    } else if (e.key === "Escape") {
      setSuggestOpen(false);
      e.target.blur();
    }
  };

  const onGoClick = (e) => {
    const r = goBtnRef.current.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const id = Date.now() + Math.random();
    const ripple = {
      id,
      size,
      left: e.clientX - r.left - size / 2,
      top: e.clientY - r.top - size / 2,
    };
    setRipples((rs) => [...rs, ripple]);
    setTimeout(() => setRipples((rs) => rs.filter((x) => x.id !== id)), 650);
    commitSearch(query);
  };

  const removeChip = (key) => {
    setActiveChipsLeaving((s) => ({ ...s, [key]: true }));
    setTimeout(() => {
      setActiveChipsLeaving((s) => {
        const n = { ...s };
        delete n[key];
        return n;
      });
      if (key === "cat") setTab("all");
      else if (key === "openOnly") setFilters((f) => ({ ...f, openOnly: false }));
      else if (key === "minRate") setFilters((f) => ({ ...f, minRate: 0 }));
      else if (key === "maxDist") setFilters((f) => ({ ...f, maxDist: 99 }));
      else if (key === "city") setFilters((f) => ({ ...f, city: "" }));
      else if (key.startsWith("amenity:")) {
        const a = key.slice(8);
        setFilters((f) => {
          const next = new Set(f.amenities);
          next.delete(a);
          return { ...f, amenities: next };
        });
      }
    }, 160);
  };

  const toggleAmenity = (a) => {
    setFilters((f) => {
      const next = new Set(f.amenities);
      next.has(a) ? next.delete(a) : next.add(a);
      return { ...f, amenities: next };
    });
  };

  const activeChips = [];
  if (filters.city) activeChips.push({ key: "city", label: `شهر: ${filters.city}` });
  if (filters.cat !== "all") activeChips.push({ key: "cat", label: CAT_META[filters.cat]?.label || filters.cat });
  if (filters.openOnly) activeChips.push({ key: "openOnly", label: "فقط بازها" });
  if (filters.minRate > 0) activeChips.push({ key: "minRate", label: "امتیاز " + filters.minRate + "+" });
  if (filters.maxDist < 99) activeChips.push({ key: "maxDist", label: "تا " + filters.maxDist + " کیلومتر" });
  filters.amenities.forEach((a) => activeChips.push({ key: "amenity:" + a, label: a }));

  const sellerMenuItem = getSellerMenuItem(isLoggedIn, authUser, hasOwnBusiness);
  const sidebarItems = getSidebarItems(sellerMenuItem, isLoggedIn);
  const bottomNavItems = getBottomNavItems(sellerMenuItem, isLoggedIn);
  const logo = isDark ? logoWhite : logoBlack;

  const handleNavClick = (item) => {
    setActiveNav(item.key);
    if (item.path) navigate(item.path);
  };

  return (
    <>
      <div className="lokaoo-root" dir="rtl" lang="fa">
        <div className="app-shell">
          <Sidebar
            items={sidebarItems}
            activeNav={activeNav}
            logoImg={logo}
            logoAlt="لوکاوو"
            onNavClick={handleNavClick}
          />
          <div className="main">
            <section className={"search-hero" + (heroCompact ? " compact" : "")}>
              <div className="mesh">
                <span className="m1"></span>
                <span className="m2"></span>
                <span className="m3"></span>
              </div>
              <div className="hero-inner">
                <div className="hero-topbar">
                  <div className="hero-topbar-actions">
                    <button className="hero-icon-btn" onClick={() => navigate(-1)} title="بازگشت">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                    <button className="hero-icon-btn" onClick={toggleTheme} title="تغییر به حالت شب/روز">
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
                  </div>
                  <h1 className="hero-topbar-title">دنبال چی می‌گردی؟</h1>
                </div>
                <p>نانوایی، کافه، تعمیرگاه یا هر کسب‌وکار محلی — همین‌جا پیداش کن</p>

                <div className="big-search" ref={bigSearchRef}>
                  <div
                    className={
                      "big-search-box" +
                      (searchFocused ? " focused" : "") +
                      (searchActive ? " active" : "")
                    }
                  >
                    <div className="radar-wrap">
                      <span className="radar-ping"></span>
                      <span className="radar-ping p2"></span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-4.3-4.3" />
                      </svg>
                    </div>

                    {/* پنل پیشنهادات */}
                    <div className={"suggest-panel" + (suggestOpen ? " open" : "")}>
                      {!query.trim() && (
                        <>
                          <div className="suggest-section-label">دسته‌بندی‌های محبوب</div>
                          <div className="suggest-chips">
                            {suggestions.cats.map(([k, v]) => (
                              <span
                                key={k}
                                className="suggest-chip"
                                onClick={() => {
                                  setSuggestOpen(false);
                                  setTab(k);
                                  setSearchFocused(false);
                                }}
                              >
                                {v.label}
                              </span>
                            ))}
                          </div>
                        </>
                      )}

                      {query.trim() && suggestions.shops.length === 0 && (
                        <div className="suggest-section-label">
                          نتیجه‌ای برای «{query.trim()}» پیدا نشد
                        </div>
                      )}

                      {query.trim() && suggestions.shops.length > 0 && (
                        <>
                          <div className="suggest-section-label">پیشنهادها</div>
                          {suggestions.shops.map((s, i) => {
                            const cm = CAT_META[s.cat] || { label: s.sub, colors: ["#666", "#999"] };
                            return (
                              <div
                                key={s.id}
                                className={"suggest-item" + (i === hiIndex ? " hi" : "")}
                                onClick={() => commitSearch(s.name)}
                              >
                                <div
                                  className="suggest-icon"
                                  style={{
                                    background: `linear-gradient(135deg,${cm.colors[0]},${cm.colors[1]})`,
                                  }}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    {ICONS[s.cat] || ICONS.bakery}
                                  </svg>
                                </div>
                                <div className="suggest-text">
                                  <div className="st-name">{highlight(s.name, query.trim())}</div>
                                  <div className="st-cat">
                                    {cm.label} · {fmtDist(s.dist)}
                                  </div>
                                </div>
                                <svg
                                  className="arrow"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M9 6l6 6-6 6" />
                                </svg>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>

                    <input
                      autoComplete="off"
                      placeholder="مثلاً «سنگک»، «تعویض روغن»، «کافه دنج»..."
                      value={query}
                      onFocus={() => {
                        setSearchFocused(true);
                        setSuggestOpen(true);
                      }}
                      onChange={onSearchInput}
                      onKeyDown={onSearchKeyDown}
                    />
                    <button
                      className={"clear-btn" + (query ? " show" : "")}
                      onClick={() => commitSearch("")}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                    <button className="search-go" ref={goBtnRef} onClick={onGoClick}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-4.3-4.3" />
                      </svg>
                      <span>جستجو</span>
                      {ripples.map((r) => (
                        <span
                          key={r.id}
                          className="ripple"
                          style={{ width: r.size, height: r.size, left: r.left, top: r.top }}
                        ></span>
                      ))}
                    </button>
                  </div>
                </div>

                <div className="trend-row">
                  <span className="trend-label">پرجستجوترین‌ها:</span>
                  {TRENDING.map((t) => (
                    <span key={t} className="trend-chip" onClick={() => commitSearch(t)}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <div className="control-bar">
              <div className="result-tabs" ref={resultTabsRef}>
                {/* اگر تب‌ها رو می‌خوای فعال کنی، اینجا اضافه کن */}
              </div>
              <div className="bar-right">
                <div className="sort-wrap">
                  <div
                    className={"sort-select" + (sortOpen ? " open" : "")}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSortOpen((o) => !o);
                    }}
                  >
                    <span>{SORT_LABELS[filters.sort]}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                  <div className={"sort-menu" + (sortOpen ? " open" : "")}>
                    {Object.entries(SORT_LABELS).map(([v, label]) => (
                      <button
                        key={v}
                        className={filters.sort === v ? "active" : ""}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilters((f) => ({ ...f, sort: v }));
                          setSortOpen(false);
                        }}
                      >
                        {label}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="view-toggle">
                  <button
                    className={filters.view === "grid" ? "active" : ""}
                    onClick={() => setFilters((f) => ({ ...f, view: "grid" }))}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                    </svg>
                  </button>
                  <button
                    className={filters.view === "list" ? "active" : ""}
                    onClick={() => setFilters((f) => ({ ...f, view: "list" }))}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

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
                      className={"switch" + (filters.openOnly ? " on" : "")}
                      onClick={() => setFilters((f) => ({ ...f, openOnly: !f.openOnly }))}
                    ></div>
                  </div>
                </div>

                <div className="f-group">
                  <h4>حداقل امتیاز</h4>
                  <div className="rate-row">
                    {[
                      { min: 0, label: "همه امتیازها", stars: null },
                      { min: 4.5, label: "۴.۵ به بالا", stars: "★★★★★" },
                      { min: 4, label: "۴ به بالا", stars: "★★★★" },
                      { min: 3.5, label: "۳.۵ به بالا", stars: "★★★" },
                    ].map((r) => (
                      <label
                        key={r.min}
                        className={"rate-opt" + (filters.minRate === r.min ? " on" : "")}
                        onClick={() => setFilters((f) => ({ ...f, minRate: r.min }))}
                      >
                        <input
                          type="radio"
                          name="rate"
                          checked={filters.minRate === r.min}
                          onChange={() => {}}
                        />
                        {r.stars && <span className="stars-mini">{r.stars}</span>}
                        {r.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="f-group">
                  <h4>فاصله</h4>
                  <div className="f-chip-grid">
                    {[
                      { dist: 99, label: "همه شهر" },
                      { dist: 0.5, label: "تا ۵۰۰ متر" },
                      { dist: 1, label: "تا ۱ کیلومتر" },
                      { dist: 3, label: "تا ۳ کیلومتر" },
                    ].map((c) => (
                      <span
                        key={c.dist}
                        className={"f-chip" + (filters.maxDist === c.dist ? " on" : "")}
                        onClick={() => setFilters((f) => ({ ...f, maxDist: c.dist }))}
                      >
                        {c.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="f-group">
                  <h4>امکانات</h4>
                  <div className="amenity-list">
                    {["پارکینگ", "ارسال", "کارتی"].map((a) => (
                      <label key={a} className="amenity">
                        <input
                          type="checkbox"
                          checked={filters.amenities.has(a)}
                          onChange={() => toggleAmenity(a)}
                        />
                        {a === "پارکینگ"
                          ? "پارکینگ مشتری"
                          : a === "ارسال"
                          ? "ارسال سفارش"
                          : "پرداخت کارتی"}
                      </label>
                    ))}
                  </div>
                </div>
              </aside>

              <div className="results-col">
                <div className="results-head">
                  <div className="results-count">
                    <b>{displayCount.toLocaleString("fa-IR")}</b> نتیجه پیدا شد
                    <span className="rtime">{rtime}</span>
                  </div>
                  <div className="active-chips">
                    {activeChips.map((c) => (
                      <span
                        key={c.key}
                        className={"active-chip" + (activeChipsLeaving[c.key] ? " out" : "")}
                      >
                        {c.label}
                        <button onClick={() => removeChip(c.key)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className={"results-grid" + (filters.view === "list" ? " list-view" : "")}>
                  {loading &&
                    Array.from({ length: filters.view === "list" ? 4 : 6 }).map((_, i) => (
                      <div key={i} className="skeleton-card"></div>
                    ))}

                  {!loading && displayList.length === 0 && (
                    <div className="empty-state">
                      <div className="e-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="7" />
                          <path d="M21 21l-4.3-4.3" />
                        </svg>
                      </div>
                      <h4>نتیجه‌ای پیدا نشد</h4>
                      <p>
                        هیچ کسب‌وکاری با این ترکیب از فیلترها مطابقت ندارد. کمی فیلترها را باز کنید.
                      </p>
                      <button onClick={resetAll}>پاک‌کردن فیلترها</button>
                    </div>
                  )}

                  {!loading &&
                    displayList.map((s, i) => {
                      const cm = CAT_META[s.cat] || {
                        label: s.sub || "کسب‌وکار",
                        colors: ["#666", "#999"],
                      };
                      return (
                        <a
                          key={s.id}
                          className="shop-card"
                          style={{
                            "--glow-color": cm.colors[0] + "40",
                            animationDelay: i * 0.05 + "s",
                          }}
                          href={`/businesses/${s.id}`}
                        >
                          <div
                            className="shop-media"
                            style={{
                              background: `linear-gradient(135deg,${cm.colors[0]},${cm.colors[1]})`,
                            }}
                          >
                            <span className={"shop-badge" + (s.open ? " open" : " closed")}>
                              {s.open ? "باز است" : "بسته"}
                            </span>
                            {s.ribbon && <span className="shop-ribbon">{s.ribbon}</span>}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                              {ICONS[s.cat] || ICONS.bakery}
                            </svg>
                            <span className="cat-tag">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {ICONS[s.cat] || ICONS.bakery}
                              </svg>
                              {cm.label}
                            </span>
                          </div>
                          <div className="shop-body">
                            <div>
                              <div className="shop-name">
                                {highlight(s.name, filters.search)}{" "}
                                {s.verified && (
                                  <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2l2.4 2.1 3.1-.6 1 3 2.9 1.3-.6 3.2 1.9 2.5-1.9 2.5.6 3.2-2.9 1.3-1 3-3.1-.6L12 24l-2.4-2.1-3.1.6-1-3-2.9-1.3.6-3.2L1.3 12.5l1.9-2.5-.6-3.2 2.9-1.3 1-3 3.1.6L12 2Z" />
                                  </svg>
                                )}
                              </div>
                              <div className="shop-tag">
                                {s.sub} · {fmtDist(s.dist)}
                              </div>
                            </div>
                            <div className="shop-meta">
                              <span className="rating">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                  <path d={STAR_PATH} />
                                </svg>{" "}
                                {s.rating || "—"}
                              </span>
                              <span>مشاهده →</span>
                            </div>
                            <div className="shop-addr">{s.addr}</div>
                          </div>
                        </a>
                      );
                    })}
                </div>
              </div>
            </div>

            <Footer />
            <div className="footer-spacer"></div>
          </div>
        </div>
        <BottomNav items={bottomNavItems} activeNav={activeNav} onNavClick={handleNavClick} />
      </div>
    </>
  );
}