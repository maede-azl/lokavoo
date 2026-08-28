import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import nmp_mapboxgl from "@neshan-maps-platform/mapbox-gl";
import "@neshan-maps-platform/mapbox-gl/dist/NeshanMapboxGl.css";
import { useTheme } from "../context/ThemeContext";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import Footer from "../components/Footer";
import { getSidebarItems, getBottomNavItems, getSellerMenuItem } from "../components/navConfig";
import logoBlack from "../assets/locavo-logo-black.png";
import logoWhite from "../assets/locavo-logo-white.png";
import "./AddBusiness.css";

/* ============ API BASE ============ */
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const NESHAN_WEB_KEY = import.meta.env.VITE_NESHAN_WEB_KEY;
const getToken = () => localStorage.getItem("token");

/* ============ ICON MAP (بر اساس key_name دسته‌بندی‌ها در دیتابیس) ============ */
const ICON_PATHS = {
  bakery: (
    <path d="M4 12a8 8 0 0 1 16 0v6H4v-6Z" />
  ),
  cafe: (
    <>
      <path d="M4 9h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
      <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" />
      <path d="M8 3c0 1-1 1-1 2s1 1 1 2M12 3c0 1-1 1-1 2s1 1 1 2" />
    </>
  ),
  auto: (
    <>
      <path d="M5 17h14M6 17l1.2-6.5A2 2 0 0 1 9.2 9h5.6a2 2 0 0 1 2 1.5L18 17" />
      <circle cx="7.5" cy="17" r="1.6" />
      <circle cx="16.5" cy="17" r="1.6" />
    </>
  ),
  beauty: (
    <>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    </>
  ),
  education: (
    <>
      <path d="M2 8l10-5 10 5-10 5-10-5Z" />
      <path d="M6 11v5c2 2 10 2 12 0v-5" />
    </>
  ),
  medical: (
    <>
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
};

const SHOP_ICON_PATH = (
  <>
    <path d="M3 9l1-5h16l1 5" />
    <path d="M4 9v10h16V9" />
    <path d="M9 21v-6h6v6" />
  </>
);

/* ============ آیکون‌های تم (خورشید / ماه) ============ */
const SUN_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <circle cx="12" cy="12" r="3.4" />
    <path d="M12 3.8v1.8M12 18.4v1.8M5.1 5.1l1.3 1.3M17.6 17.6l1.3 1.3M2.8 12h1.8M19.4 12h1.8M5.1 18.9l1.3-1.3M17.6 6.4l1.3-1.3" />
  </svg>
);

const MOON_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19.8 13.3A7.6 7.6 0 1 1 10.7 4.2a6 6 0 0 0 9.1 9.1Z" />
  </svg>
);

const BACK_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];
const RING_CIRC = 151;
const VISIBLE_CAT_COUNT = 6;
const BASE_LAT = 35.6892;
const BASE_LNG = 51.389;

export default function AddBusiness({ onBack }) {
  const navigate = useNavigate();
  const goBack = onBack || (() => navigate(-1));

  /* ---------- theme (سراسری) ---------- */
  const { toggleTheme, isDark } = useTheme();
  const logoImg = isDark ? logoWhite : logoBlack;

  /* ---------- احراز هویت ---------- */
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

  /* ---------- ناوبری ---------- */
  const sellerMenuItem = getSellerMenuItem(isLoggedIn, authUser, hasOwnBusiness);
  const sidebarItems = getSidebarItems(sellerMenuItem, isLoggedIn);
  const bottomNavItems = getBottomNavItems(sellerMenuItem, isLoggedIn);
  const [activeNav, setActiveNav] = useState("add-business");

  useEffect(() => {
    setActiveNav(sellerMenuItem?.key || "add-business");
  }, [sellerMenuItem?.key]);

  const handleNavClick = (item) => {
    setActiveNav(item.key);
    if (item.path) navigate(item.path);
  };

  /* ---------- دسته‌بندی‌ها ---------- */
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.data);
        }
      })
      .catch((err) => console.error("خطا در دریافت دسته‌بندی‌ها:", err))
      .finally(() => setCategoriesLoading(false));
  }, []);

  /* ---------- form state ---------- */
  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [openHour, setOpenHour] = useState("08");
  const [openMinute, setOpenMinute] = useState("00");
  const [closeHour, setCloseHour] = useState("21");
  const [closeMinute, setCloseMinute] = useState("00");
  const [images, setImages] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [coords, setCoords] = useState(null);
  const [manualAddress, setManualAddress] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);
  const submitBtnRef = useRef(null);

  /* ---------- نقشه‌ی نشان ---------- */
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const [markerPos, setMarkerPos] = useState({ lat: BASE_LAT, lng: BASE_LNG });
  const [markerAddress, setMarkerAddress] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  /* ---------- مودال دسته‌بندی ---------- */
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catSearch, setCatSearch] = useState("");

  /* ---------- image object URLs ---------- */
  useEffect(() => {
    const urls = images.map((f) => URL.createObjectURL(f));
    setImageUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [images]);

  /* ---------- title preview ---------- */
  const showTitlePreview = !!shopName;

  /* ---------- hours visual ---------- */
  const oh = Number(openHour) + Number(openMinute) / 60;
  const ch = Number(closeHour) + Number(closeMinute) / 60;
  let hoursLeft = "0%",
    hoursRight = "0%";
  if (ch >= oh) {
    hoursLeft = (oh / 24) * 100 + "%";
    hoursRight = 100 - (ch / 24) * 100 + "%";
  }

  /* ---------- progress ---------- */
  let pct = 0;
  if (shopName) pct += 30;
  if (categoryId) pct += 30;
  if (coords) pct += 25;
  if (phone) pct += 8;
  if (images.length) pct += 7;
  pct = Math.min(pct, 100);
  const pctFa = pct.toLocaleString("fa-IR") + "٪";
  const ringOffset = RING_CIRC - (RING_CIRC * pct) / 100;

  /* ---------- images ---------- */
  const addImages = useCallback((files) => {
    setImages((prev) => [...prev, ...files]);
  }, []);

  const removeImage = (i) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleFileInputChange = (e) => {
    addImages(Array.from(e.target.files));
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    addImages(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/")));
  };

  /* ---------- نقشه: توابع کمکی ---------- */
  const reverseGeocode = async (lat, lng) => {
    try {
      console.log("درخواست reverse برای:", lat, lng);
      const res = await fetch(`${API_BASE}/api/neshan/reverse?lat=${lat}&lng=${lng}`);
      const data = await res.json();

      console.log("جواب کامل reverse:", data);

      const address =
        data.formatted_address ||
        data.address ||
        [data.neighbourhood, data.city, data.state].filter(Boolean).join("، ") ||
        "";

      console.log("آدرس نهایی:", address);

      setMarkerAddress(address || "");
      return address;
    } catch (err) {
      console.error("reverse geocode error:", err);
      return "";
    }
  };

  const initMap = () => {
    if (mapInstanceRef.current || !mapContainerRef.current) return;

    const center = coords ? [coords.lng, coords.lat] : [BASE_LNG, BASE_LAT];

    const map = new nmp_mapboxgl.Map({
      mapType: nmp_mapboxgl.Map.mapTypes.neshanVector,
      container: mapContainerRef.current,
      zoom: 14,
      center,
      mapKey: NESHAN_WEB_KEY,
      poi: true,
      traffic: false,
      mapTypeControllerOptions: { show: false },
    });

    const marker = new nmp_mapboxgl.Marker({ color: "#2547E8", draggable: true })
      .setLngLat(center)
      .addTo(map);

    const onMarkerMove = () => {
      const { lat, lng } = marker.getLngLat();
      setMarkerPos({ lat, lng });
      reverseGeocode(lat, lng);
    };

    marker.on("dragend", onMarkerMove);
    map.on("click", (e) => {
      marker.setLngLat(e.lngLat);
      onMarkerMove();
    });

    mapInstanceRef.current = map;
    markerInstanceRef.current = marker;
    setMarkerPos({ lat: center[1], lng: center[0] });
    reverseGeocode(center[1], center[0]);
  };

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const openMapModal = () => {
    setSearchTerm("");
    setSearchResults([]);
    setMapOpen(true);
    setTimeout(() => {
      if (!mapInstanceRef.current) {
        initMap();
      } else {
        mapInstanceRef.current.resize();
        if (coords) {
          mapInstanceRef.current.setCenter([coords.lng, coords.lat]);
          markerInstanceRef.current.setLngLat([coords.lng, coords.lat]);
          setMarkerPos({ lat: coords.lat, lng: coords.lng });
          setMarkerAddress(coords.address || "");
        }
      }
    }, 50);
  };

  const closeMapModal = () => setMapOpen(false);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { lat, lng } = markerPos;
        const res = await fetch(
          `${API_BASE}/api/neshan/search?term=${encodeURIComponent(val)}&lat=${lat}&lng=${lng}`
        );
        const data = await res.json();
        setSearchResults(data.items || data.results || []);
      } catch (err) {
        console.error("search error:", err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  };

  const selectSearchResult = (item) => {
    const lng = item.location.x;
    const lat = item.location.y;
    if (mapInstanceRef.current) mapInstanceRef.current.flyTo({ center: [lng, lat], zoom: 16 });
    if (markerInstanceRef.current) markerInstanceRef.current.setLngLat([lng, lat]);
    setMarkerPos({ lat, lng });
    setMarkerAddress(item.address || item.title || "");
    setSearchTerm(item.title || "");
    setSearchResults([]);
  };

  const mapCoordsLabel = `${markerPos.lat.toFixed(4)}، ${markerPos.lng.toFixed(4)}`;

  const confirmMap = async () => {
    let finalAddress = markerAddress;

    if (!finalAddress || finalAddress.trim().length < 3) {
      finalAddress = await reverseGeocode(markerPos.lat, markerPos.lng);
    }

    if (!finalAddress || finalAddress.trim().length < 3) {
      finalAddress = `موقعیت انتخاب‌شده (${markerPos.lat.toFixed(5)}, ${markerPos.lng.toFixed(5)})`;
    }

    const c = {
      lat: markerPos.lat,
      lng: markerPos.lng,
      address: finalAddress,
    };

    setCoords(c);
    setManualAddress(finalAddress);
    setMapOpen(false);
  };

  const removeLocation = () => {
    setCoords(null);
    setManualAddress("");
  };

  /* ---------- preview ---------- */
  const selectedCategory = categories.find((c) => c.id === Number(categoryId));

  /* ---------- category button renderer ---------- */
  const renderCatButton = (c, i) => (
    <button
      key={c.id}
      type="button"
      className={"cat-opt" + (Number(categoryId) === c.id ? " on" : "")}
      onClick={() => {
        setCategoryId(c.id);
        setCatModalOpen(false);
      }}
      style={{ animationDelay: `${i * 0.045}s` }}
    >
      <span className="check">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </span>
      <div
        className="cat-ic"
        style={{ background: `linear-gradient(135deg,${c.color_1 || "#B9C2D6"},${c.color_2 || "#DDE3EF"})` }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {ICON_PATHS[c.key_name] || SHOP_ICON_PATH}
        </svg>
      </div>
      <span className="cat-label">{c.name}</span>
    </button>
  );

  /* ---------- submit ---------- */
  const [ripples, setRipples] = useState([]);

  const handleSubmit = async (e) => {
    setErrorMsg("");
    if (!shopName || !categoryId || !coords) {
      setErrorMsg("لطفاً فیلدهای الزامی را پر کنید.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", shopName);
      formData.append("description", description);
      formData.append("category_id", categoryId);
      formData.append("phone", phone);
      formData.append("address", manualAddress || (coords && coords.address) || "");
      formData.append("latitude", coords.lat);
      formData.append("longitude", coords.lng);
      formData.append("opening_time", `${openHour}:${openMinute}`);
      formData.append("closing_time", `${closeHour}:${closeMinute}`);
      images.forEach((file) => {
        formData.append("images", file);
      });

      const token = getToken();
      const res = await fetch(`${API_BASE}/api/businesses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(data.message || data.errors?.[0]?.message || "خطا در ثبت");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("خطا در ارتباط با سرور");
    } finally {
      setSubmitting(false);
    }
  };

  /* ============ SUCCESS SCREEN ============ */
  if (submitted) {
    return (
      <div className="addbiz-root" dir="rtl" lang="fa">
        <div className="success-wrap">
          <div className="success-card">
            <div className="success-ring">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1>ثبت شد!</h1>
            <p>کسب‌وکار «{shopName}» ثبت شد و پس از تایید ادمین در نتایج جستجو نمایش داده می‌شود.</p>
            <button className="btn-submit" style={{ margin: "0 auto" }} onClick={goBack}>
              بازگشت به داشبورد
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="addbiz-root" dir="rtl" lang="fa">
      <div className={"app-shell" + (catModalOpen ? " app-blur" : "")}>
        <Sidebar
          items={sidebarItems}
          activeNav={activeNav}
          onNavClick={handleNavClick}
          logoImg={logoImg}
        />
        <div className="main">
          <section className="page-head">
            <div className="mesh">
              <span className="m1"></span>
              <span className="m2"></span>
            </div>
            <div className="page-head-left">
              <div className="header-icon-group">
                <button className="header-icon-btn" onClick={goBack} aria-label="بازگشت">
                  {BACK_ICON}
                </button>
                <button
                  className="header-icon-btn"
                  onClick={toggleTheme}
                  aria-label="تغییر تم"
                  title={isDark ? "حالت روشن" : "حالت تیره"}
                >
                  {isDark ? SUN_ICON : MOON_ICON}
                </button>
              </div>
              <div className="page-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 9l1-5h16l1 5" />
                  <path d="M4 9v10h16V9" />
                  <path d="M9 21v-6h6v6" />
                </svg>
              </div>
              <div>
                <h1>افزودن کسب‌وکار</h1>
                <p>اطلاعات مغازه یا خدمات خود را وارد کنید</p>
              </div>
            </div>
            <div className="page-head-right">
              <div className="progress-ring-wrap">
                <div className="pr-text">
                  <b>{pctFa}</b>
                  <span>تکمیل پروفایل</span>
                </div>
                <div className="progress-ring">
                  <svg viewBox="0 0 58 58">
                    <circle className="track" cx="29" cy="29" r="24" />
                    <circle className="bar" cx="29" cy="29" r="24" style={{ strokeDashoffset: ringOffset }} />
                  </svg>
                  <div className="pr-num">{pctFa}</div>
                </div>
              </div>
            </div>
          </section>

          <div className="form-shell">
            <div className="form-main">
              {/* بخش ۱: اطلاعات پایه */}
              <div className="form-card" style={{ animationDelay: ".03s" }}>
                <div className="card-head">
                  <div className="card-num">۱</div>
                  <div>
                    <h3>اطلاعات پایه</h3>
                    <p>نام و مشخصات اصلی کسب‌وکار</p>
                  </div>
                </div>
                <div className="field">
                  <label>
                    نام مغازه یا کسب‌وکار <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً: نانوایی سنتی احمدی"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                  />
                  <div className={"title-preview" + (showTitlePreview ? " show" : "")}>
                    <span>پیش‌نمایش تایتل:</span> <b>{shopName}</b>
                  </div>
                </div>
                <div className="field">
                  <label>
                    توضیحات <span style={{ fontWeight: 500 }}>(اختیاری)</span>
                  </label>
                  <textarea
                    placeholder="مثلاً: بهترین نان شهر، تازه و داغ از تنور"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>
                    شماره تماس مغازه <span style={{ fontWeight: 500 }}>(اختیاری)</span>
                  </label>
                  <div className="input-wrap">
                    <input
                      type="text"
                      placeholder="مثلاً: 09121234567"
                      style={{ direction: "ltr", textAlign: "right" }}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>
                    دسته‌بندی کسب‌وکار <span className="req">*</span>
                  </label>
                  {categoriesLoading ? (
                    <p style={{ color: "var(--text-muted)", fontSize: 13 }}>در حال بارگذاری دسته‌بندی‌ها...</p>
                  ) : categories.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: 13 }}>دسته‌بندی‌ای یافت نشد.</p>
                  ) : (
                    <>
                      <div className="cat-grid">
                        {categories.slice(0, VISIBLE_CAT_COUNT).map((c, i) => renderCatButton(c, i))}
                      </div>
                      {categories.length > VISIBLE_CAT_COUNT && (
                        <button
                          type="button"
                          className="cat-show-all"
                          onClick={() => {
                            setCatSearch("");
                            setCatModalOpen(true);
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                          <span>نمایش همه دسته‌بندی‌ها</span>
                          <b>{categories.length.toLocaleString("fa-IR")}</b>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* بخش ۲: موقعیت */}
              <div className="form-card" style={{ animationDelay: ".09s" }}>
                <div className="card-head">
                  <div className="card-num">۲</div>
                  <div>
                    <h3>موقعیت و آدرس</h3>
                    <p>محل دقیق مغازه روی نقشه</p>
                  </div>
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  {!coords ? (
                    <div className="map-trigger" onClick={openMapModal}>
                      <div className="mt-left">
                        <div className="mt-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" />
                            <circle cx="12" cy="10" r="2.4" />
                          </svg>
                        </div>
                        <div>
                          <div className="mt-title">موقعیت روی نقشه انتخاب نشده</div>
                          <div className="mt-sub">برای دیده‌شدن در نقشه شهر لازم است</div>
                        </div>
                      </div>
                      <svg className="mt-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 6l-6 6 6 6" transform="scale(-1,1) translate(-24,0)" />
                      </svg>
                    </div>
                  ) : (
                    <div className="location-card">
                      <div className="mini-map">
                        <svg className="pin-drop" viewBox="0 0 24 30" fill="currentColor">
                          <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 18 12 18s12-9 12-18C24 5.4 18.6 0 12 0Z" />
                          <circle cx="12" cy="12" r="5" fill="var(--surface)" />
                        </svg>
                      </div>
                      <div className="location-info">
                        <div className="location-addr">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" />
                            <circle cx="12" cy="10" r="2.4" />
                          </svg>
                          <span>{coords.address}</span>
                        </div>
                        <div className="location-actions">
                          <button onClick={openMapModal}>🗺️ تغییر موقعیت</button>
                          <button className="danger" onClick={removeLocation}>
                            ✕ حذف موقعیت
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {coords && (
                    <div className="field" style={{ marginTop: 12, marginBottom: 0 }}>
                      <label>آدرس دقیق (در صورت نیاز ویرایش کنید)</label>
                      <input
                        type="text"
                        placeholder="آدرس دقیق را وارد کنید"
                        value={manualAddress}
                        onChange={(e) => setManualAddress(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* بخش ۳: تصاویر */}
              <div className="form-card" style={{ animationDelay: ".15s" }}>
                <div className="card-head">
                  <div className="card-num">۳</div>
                  <div>
                    <h3>تصاویر کسب‌وکار</h3>
                    <p>عکس واضح، اعتماد مشتری را بیشتر می‌کند</p>
                  </div>
                </div>
                <div
                  className={"dropzone" + (dragActive ? " drag" : "")}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                  }}
                  onDrop={handleDrop}
                >
                  <div className="dz-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 16.8V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11" />
                      <path d="M21 15l-5-5-4 4-3-3-5 5" />
                      <circle cx="8" cy="8.5" r="1.4" />
                    </svg>
                  </div>
                  <p>عکس‌ها را بکشید و رها کنید</p>
                  <span>یا کلیک کنید — PNG، JPG تا ۵ مگابایت</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={handleFileInputChange}
                  />
                </div>
                <div className="thumb-grid">
                  {imageUrls.map((url, i) => (
                    <div className="thumb" key={i} style={{ animationDelay: i * 0.04 + "s" }}>
                      <img src={url} alt="preview" />
                      <span className="thumb-remove" onClick={() => removeImage(i)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* بخش ۴: ساعت کاری */}
              <div className="form-card" style={{ animationDelay: ".21s" }}>
                <div className="card-head">
                  <div className="card-num">۴</div>
                  <div>
                    <h3>ساعت کاری</h3>
                    <p>بازه‌ی فعالیت روزانه‌ی مغازه</p>
                  </div>
                </div>
                <div className="time-range">
                  <div className="time-group">
                    <span>از</span>
                    <select className="time-select" value={openHour} onChange={(e) => setOpenHour(e.target.value)}>
                      {HOURS.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <span>:</span>
                    <select className="time-select" value={openMinute} onChange={(e) => setOpenMinute(e.target.value)}>
                      {MINUTES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="time-group">
                    <span>تا</span>
                    <select className="time-select" value={closeHour} onChange={(e) => setCloseHour(e.target.value)}>
                      {HOURS.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <span>:</span>
                    <select className="time-select" value={closeMinute} onChange={(e) => setCloseMinute(e.target.value)}>
                      {MINUTES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="hours-visual">
                  <div className="hours-track">
                    <div className="hours-fill" style={{ left: hoursLeft, right: hoursRight }}></div>
                  </div>
                  <div className="hours-ticks">
                    <span>۰</span>
                    <span>۶</span>
                    <span>۱۲</span>
                    <span>۱۸</span>
                    <span>۲۴</span>
                  </div>
                </div>
                <div className="time-badge">
                  🕘 {openHour}:{openMinute} تا {closeHour}:{closeMinute}
                </div>
              </div>

              <div>
                {errorMsg && (
                  <p className="field-error">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v5M12 16.5v.01" />
                    </svg>
                    {errorMsg}
                  </p>
                )}
              </div>

              <div className="submit-bar">
                <div className="sb-progress">
                  <div className="sb-label">
                    <span>پیشرفت تکمیل اطلاعات</span>
                    <b>{pctFa}</b>
                  </div>
                  <div className="sb-track">
                    <div className="sb-fill" style={{ width: pct + "%" }}></div>
                  </div>
                </div>
                <button className="btn-submit" ref={submitBtnRef} disabled={submitting} onClick={handleSubmit}>
                  {ripples.map((rp) => (
                    <span
                      key={rp.id}
                      className="ripple"
                      style={{ width: rp.size, height: rp.size, left: rp.left, top: rp.top }}
                    ></span>
                  ))}
                  {submitting ? (
                    <>
                      <svg className="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <path d="M21 12a9 9 0 1 1-3-6.7" />
                      </svg>
                      <span>در حال ثبت...</span>
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      <span>ثبت کسب‌وکار</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* PREVIEW */}
            <div className="preview-col">
              <div className="preview-label-row">
                <span className="live-dot"></span>
                <span>این‌طور در نتایج جستجو دیده می‌شود</span>
              </div>
              <div className="shop-card">
                <div
                  className="shop-media"
                  style={{
                    background: selectedCategory
                      ? `linear-gradient(135deg,${selectedCategory.color_1 || "#B9C2D6"},${selectedCategory.color_2 || "#DDE3EF"})`
                      : "linear-gradient(135deg,#B9C2D6,#DDE3EF)",
                  }}
                >
                  {imageUrls.length > 0 && <img src={imageUrls[0]} alt="" />}
                  <svg
                    className="cat-glyph"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    style={{ opacity: imageUrls.length > 0 ? 0 : 1 }}
                  >
                    {selectedCategory ? ICON_PATHS[selectedCategory.key_name] || SHOP_ICON_PATH : SHOP_ICON_PATH}
                  </svg>
                  <span className="shop-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <path d="M12 8v4l3 3" />
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                    در انتظار تایید
                  </span>
                </div>
                <div className="shop-body">
                  <div className={"shop-name" + (shopName ? "" : " placeholder")}>
                    {shopName || "نام مغازه شما"}
                  </div>
                  <div className="shop-tag">{selectedCategory ? selectedCategory.name : "دسته‌بندی انتخاب نشده"}</div>
                  <div className="shop-meta">
                    <span className="new-tag">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
                      </svg>
                      تازه ثبت شده
                    </span>
                    <span style={{ direction: "ltr" }}>{phone}</span>
                  </div>
                  <div className="shop-addr">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" />
                      <circle cx="12" cy="10" r="2.4" />
                    </svg>
                    <span>{manualAddress || (coords && coords.address) || "آدرس هنوز ثبت نشده"}</span>
                  </div>
                </div>
              </div>
              <div className="preview-note">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5M12 16.5v.01" />
                </svg>
                کارت بالا دقیقاً همانی است که مشتری‌ها در نتایج جستجو و دسته‌بندی می‌بینند — با پرکردن فیلدها، آن را زنده مشاهده کنید.
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>

      {/* منوی پایین صفحه — نسخه موبایل */}
      <BottomNav items={bottomNavItems} activeNav={activeNav} onNavClick={handleNavClick} />

      {/* CATEGORY MODAL */}
      <div className={"cat-modal-backdrop" + (catModalOpen ? " open" : "")} onClick={() => setCatModalOpen(false)}>
        <div className="cat-modal" onClick={(e) => e.stopPropagation()}>
          <div className="cat-modal-head">
            <h3>انتخاب دسته‌بندی کسب‌وکار</h3>
            <button onClick={() => setCatModalOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="cat-modal-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="جستجوی دسته‌بندی..."
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
              autoFocus
            />
            {catSearch && (
              <span className="cat-modal-clear" onClick={() => setCatSearch("")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </span>
            )}
          </div>
          <div className="cat-modal-body">
            {categories.filter((c) => c.name.includes(catSearch.trim())).length === 0 ? (
              <p className="cat-modal-empty">دسته‌بندی‌ای یافت نشد</p>
            ) : (
              <div className="cat-modal-grid">
                {categories
                  .filter((c) => c.name.includes(catSearch.trim()))
                  .map((c, i) => renderCatButton(c, i))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MAP MODAL */}
      <div className={"modal-backdrop" + (mapOpen ? " open" : "")}>
        <div className="map-modal">
          <div className="map-modal-head">
            <h3>موقعیت مغازه را روی نقشه انتخاب کنید</h3>
            <button onClick={closeMapModal}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="map-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="جستجوی آدرس، محله یا نام مکان..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchLoading && <span className="map-search-spinner"></span>}
            {searchResults.length > 0 && (
              <ul className="map-search-results">
                {searchResults.map((item, i) => (
                  <li key={i} onClick={() => selectSearchResult(item)}>
                    <b>{item.title}</b>
                    <span>{item.address}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="map-canvas" ref={mapContainerRef}></div>
          <div className="map-modal-foot">
            <span className="map-coords">{mapCoordsLabel}</span>
            <button className="map-confirm" onClick={confirmMap}>
              تایید موقعیت
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}