import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./HomePage.css";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import {
  getSellerMenuItem,
  getSidebarItems,
  getBottomNavItems,
} from "./components/navConfig";
import logoBlack from "./assets/locavo-logo-black.png";
import logoWhite from "./assets/locavo-logo-white.png";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const CAT_COLLAPSED_COUNT = 5;

// رنگ‌های پیش‌فرض چرخشی برای دسته‌بندی‌هایی که رنگ اختصاصی ندارند
const CAT_FALLBACK_COLORS = [
  "#2547E8",
  "#EF4444",
  "#F97316",
  "#0D9488",
  "#7C3AED",
  "#DB2777",
  "#059669",
  "#0EA5E9",
  "#D97706",
  "#E11D48",
];

function fallbackCatColor(id) {
  const n = Number(id) || 0;
  return CAT_FALLBACK_COLORS[n % CAT_FALLBACK_COLORS.length];
}

/* آیکون‌های خطی (SVG path) دقیقاً مطابق نسخه‌ی HTML */
const catIcons = {
  "رستوران و کافه": `<path d="M6 2v8a2 2 0 0 0 2 2v10"/><path d="M6 2v6M9 2v6"/><path d="M17 2c-2.2 0-3 3-3 6.5S15 13 17 13v9"/>`,
  "هتل و اقامتگاه": `<path d="M3 19v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8"/><path d="M3 14h18"/><path d="M7 14v-2a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v2"/><path d="M3 19v2M21 19v2"/>`,
  "پزشک، درمانگاه و بیمارستان": `<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>`,
  "داروخانه": `<rect x="2" y="9" width="20" height="6" rx="3"/><path d="M12 9v6"/>`,
  "آرایشگاه و سالن زیبایی": `<circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><path d="M20 4L8.5 15.5M20 20L8.5 8.5"/>`,
  "مراکز ماساژ و اسپا": `<path d="M12 2c4.2 4.2 7 8.3 7 12.2A7 7 0 0 1 5 14.2C5 10.3 7.8 6.2 12 2Z"/>`,
  "باشگاه ورزشی": `<path d="M4 9v6M2 10v4M20 9v6M22 10v4"/><path d="M7 12h10"/><path d="M4 12h0M20 12h0"/>`,
  "آموزشگاه و کلاس آموزشی": `<path d="M2 8l10-5 10 5-10 5-10-5Z"/><path d="M6 11v5c2 2 10 2 12 0v-5"/>`,
  "سوپرمارکت و فروشگاه مواد غذایی": `<circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M2 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L21 7H6"/>`,
  "پوشاک و کیف و کفش": `<path d="M8 3l4 2 4-2 4 4-3 3v10H7V10L4 7Z"/>`,
  "طلا، جواهر و اکسسوری": `<path d="M6 3h12l4 6-10 12L2 9Z"/><path d="M2 9h20M9 3l3 6-3 12M15 3l-3 6 3 12"/>`,
  "موبایل و لوازم دیجیتال": `<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>`,
  "خدمات کامپیوتر و فناوری": `<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>`,
  "نمایشگاه خودرو": `<path d="M3 13l2-6h14l2 6"/><rect x="3" y="13" width="18" height="6" rx="1"/><circle cx="7.5" cy="19" r="1.5"/><circle cx="16.5" cy="19" r="1.5"/>`,
  "تعمیرگاه خودرو": `<path d="M21 7a4 4 0 0 1-5.7 3.6L6.7 20 4 17.3l9.4-9.3A4 4 0 1 1 21 7Z"/>`,
  "خدمات خودرو (کارواش، تعویض روغن و...)": `<path d="M12 2s6 6.8 6 11.5a6 6 0 0 1-12 0C6 8.8 12 2 12 2Z"/>`,
  "بانک و خدمات مالی": `<path d="M3 10l9-6 9 6"/><path d="M4 10v9M9 10v9M15 10v9M20 10v9"/><path d="M2 21h20"/>`,
  "املاک": `<path d="M4 21V10l8-6 8 6v11"/><path d="M9 21v-6h6v6"/>`,
  "وکیل و مشاور حقوقی": `<path d="M12 3v18M6 21h12"/><path d="M3 7l4-3 4 3-4 4-4-4Z"/><path d="M13 7l4-3 4 3-4 4-4-4Z"/>`,
  "عکاسی و آتلیه": `<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l2-3h4l2 3"/><circle cx="12" cy="13.5" r="3.4"/>`,
  "تالار و تشریفات": `<path d="M12 3l1.6 4.6L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.4Z"/><path d="M4 20h16"/>`,
  "گل‌فروشی": `<circle cx="12" cy="12" r="2.3"/><circle cx="12" cy="5" r="2.3"/><circle cx="12" cy="19" r="2.3"/><circle cx="5" cy="12" r="2.3"/><circle cx="19" cy="12" r="2.3"/>`,
  "کادو و صنایع دستی": `<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 9V6h18v3"/><path d="M12 6v15"/><path d="M12 6c-2 0-4.5-1-4.5-3s2.5-2 4.5 0c2-2 4.5-2 4.5 0s-2.5 3-4.5 3Z"/>`,
  "خدمات حیوانات خانگی": `<circle cx="7" cy="8" r="1.5"/><circle cx="11" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="18.5" cy="9" r="1.5"/><path d="M12 12c-3.8 0-6 2.3-6 4.8a3 3 0 0 0 6 1 3 3 0 0 0 6-1c0-2.5-2.2-4.8-6-4.8Z"/>`,
  "خدمات فنی و تعمیرات": `<path d="M14 7l3 3-8 8-3-3 8-8Z"/><path d="M17 4l3 3-2 2-3-3 2-2Z"/>`,
  "خدمات نظافت": `<path d="M6 21l9-9M15 6l3 3M18 3l3 3"/>`,
  "حمل‌ونقل و باربری": `<rect x="1" y="7" width="13" height="9" rx="1"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>`,
  "آژانس مسافرتی": `<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7Z"/>`,
  "اماکن مذهبی": `<path d="M12 2a5 5 0 0 1 5 5v2H7V7a5 5 0 0 1 5-5Z"/><path d="M4 21V13h16v8"/><path d="M12 13V9"/>`,
  "مراکز فرهنگی و هنری": `<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2s-1-1.4-1-2.3 1-1.4 2-1.4h2.3A3.7 3.7 0 0 0 21 11.5C21 6.8 17 3 12 3Z"/><circle cx="7.5" cy="10.5" r="1.2"/><circle cx="11" cy="7.5" r="1.2"/><circle cx="15.5" cy="8.5" r="1.2"/>`,
  "سینما و تفریح": `<rect x="3" y="8" width="18" height="13" rx="1"/><path d="M3 8l2-4h4l-2 4M11 8l2-4h4l-2 4"/>`,
  "جاذبه‌های گردشگری": `<path d="M2 20l7-12 4 6 3-4 6 10Z"/>`,
  "خدمات چاپ و تبلیغات": `<rect x="4" y="9" width="16" height="8" rx="1"/><path d="M7 9V4h10v5M7 17v4h10v-4"/>`,
  "تولیدی و کارخانه": `<path d="M3 21V11l5 3v-3l5 3V8l5 3v10Z"/>`,
  "سایر": `<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>`,
};

const catIconsByKey = {
  "restaurant-cafe": `<path d="M6 2v8a2 2 0 0 0 2 2v10"/><path d="M6 2v6M9 2v6"/><path d="M17 2c-2.2 0-3 3-3 6.5S15 13 17 13v9"/>`,
  hotel: `<path d="M3 19v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8"/><path d="M3 14h18"/><path d="M7 14v-2a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v2"/><path d="M3 19v2M21 19v2"/>`,
  medical: `<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>`,
  pharmacy: `<rect x="2" y="9" width="20" height="6" rx="3"/><path d="M12 9v6"/>`,
  beauty: `<circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><path d="M20 4L8.5 15.5M20 20L8.5 8.5"/>`,
  spa: `<path d="M12 2c4.2 4.2 7 8.3 7 12.2A7 7 0 0 1 5 14.2C5 10.3 7.8 6.2 12 2Z"/>`,
  gym: `<path d="M4 9v6M2 10v4M20 9v6M22 10v4"/><path d="M7 12h10"/><path d="M4 12h0M20 12h0"/>`,
  education: `<path d="M2 8l10-5 10 5-10 5-10-5Z"/><path d="M6 11v5c2 2 10 2 12 0v-5"/>`,
  supermarket: `<circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M2 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L21 7H6"/>`,
  clothing: `<path d="M8 3l4 2 4-2 4 4-3 3v10H7V10L4 7Z"/>`,
  jewelry: `<path d="M6 3h12l4 6-10 12L2 9Z"/><path d="M2 9h20M9 3l3 6-3 12M15 3l-3 6 3 12"/>`,
  mobile: `<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>`,
  computer: `<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>`,
  "car-showroom": `<path d="M3 13l2-6h14l2 6"/><rect x="3" y="13" width="18" height="6" rx="1"/><circle cx="7.5" cy="19" r="1.5"/><circle cx="16.5" cy="19" r="1.5"/>`,
  "car-repair": `<path d="M21 7a4 4 0 0 1-5.7 3.6L6.7 20 4 17.3l9.4-9.3A4 4 0 1 1 21 7Z"/>`,
  "car-services": `<path d="M12 2s6 6.8 6 11.5a6 6 0 0 1-12 0C6 8.8 12 2 12 2Z"/>`,
  bank: `<path d="M3 10l9-6 9 6"/><path d="M4 10v9M9 10v9M15 10v9M20 10v9"/><path d="M2 21h20"/>`,
  "real-estate": `<path d="M4 21V10l8-6 8 6v11"/><path d="M9 21v-6h6v6"/>`,
  lawyer: `<path d="M12 3v18M6 21h12"/><path d="M3 7l4-3 4 3-4 4-4-4Z"/><path d="M13 7l4-3 4 3-4 4-4-4Z"/>`,
  photography: `<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l2-3h4l2 3"/><circle cx="12" cy="13.5" r="3.4"/>`,
  "event-hall": `<path d="M12 3l1.6 4.6L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.4Z"/><path d="M4 20h16"/>`,
  florist: `<circle cx="12" cy="12" r="2.3"/><circle cx="12" cy="5" r="2.3"/><circle cx="12" cy="19" r="2.3"/><circle cx="5" cy="12" r="2.3"/><circle cx="19" cy="12" r="2.3"/>`,
  "gift-handicraft": `<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 9V6h18v3"/><path d="M12 6v15"/><path d="M12 6c-2 0-4.5-1-4.5-3s2.5-2 4.5 0c2-2 4.5-2 4.5 0s-2.5 3-4.5 3Z"/>`,
  "pet-services": `<circle cx="7" cy="8" r="1.5"/><circle cx="11" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="18.5" cy="9" r="1.5"/><path d="M12 12c-3.8 0-6 2.3-6 4.8a3 3 0 0 0 6 1 3 3 0 0 0 6-1c0-2.5-2.2-4.8-6-4.8Z"/>`,
  "technical-services": `<path d="M14 7l3 3-8 8-3-3 8-8Z"/><path d="M17 4l3 3-2 2-3-3 2-2Z"/>`,
  cleaning: `<path d="M6 21l9-9M15 6l3 3M18 3l3 3"/>`,
  transport: `<rect x="1" y="7" width="13" height="9" rx="1"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>`,
  "travel-agency": `<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7Z"/>`,
  religious: `<path d="M12 2a5 5 0 0 1 5 5v2H7V7a5 5 0 0 1 5-5Z"/><path d="M4 21V13h16v8"/><path d="M12 13V9"/>`,
  cultural: `<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2s-1-1.4-1-2.3 1-1.4 2-1.4h2.3A3.7 3.7 0 0 0 21 11.5C21 6.8 17 3 12 3Z"/><circle cx="7.5" cy="10.5" r="1.2"/><circle cx="11" cy="7.5" r="1.2"/><circle cx="15.5" cy="8.5" r="1.2"/>`,
  cinema: `<rect x="3" y="8" width="18" height="13" rx="1"/><path d="M3 8l2-4h4l-2 4M11 8l2-4h4l-2 4"/>`,
  tourism: `<path d="M2 20l7-12 4 6 3-4 6 10Z"/>`,
  "print-ads": `<rect x="4" y="9" width="16" height="8" rx="1"/><path d="M7 9V4h10v5M7 17v4h10v-4"/>`,
  factory: `<path d="M3 21V11l5 3v-3l5 3V8l5 3v10Z"/>`,
  Bakery: `<path d="M4 11c0-3.5 2.5-6 4.5-6h7c2 0 4.5 2.5 4.5 6v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7Z"/><path d="M8 5v3M12 5v3M16 5v3"/><path d="M6 15h12"/>`,
  fruit: `<path d="M12 2c-4 0-7 3-7 7 0 2.5 1.5 4.5 3.5 5.5L7 20h10l-1.5-5.5C17.5 13.5 19 11.5 19 9c0-4-3-7-7-7Z"/><path d="M12 2v3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/>`,
  other: `<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>`,
  cafe: `<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/>`,
  "dry-fruit": `<path d="M12 2c-4 0-7 3-7 7 0 2.5 1.5 4.5 3.5 5.5L7 20h10l-1.5-5.5C17.5 13.5 19 11.5 19 9c0-4-3-7-7-7Z"/><path d="M12 2v3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/>`,
  atelier: `<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l2-3h4l2 3"/><circle cx="12" cy="13.5" r="3.4"/>`,
  restaurant: `<path d="M6 2v8a2 2 0 0 0 2 2v10"/><path d="M6 2v6M9 2v6"/><path d="M17 2c-2.2 0-3 3-3 6.5S15 13 17 13v9"/>`,
  confectionery: `<path d="M4 11c0-3.5 2.5-6 4.5-6h7c2 0 4.5 2.5 4.5 6v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7Z"/><path d="M8 5v3M12 5v3M16 5v3"/><path d="M6 15h12"/>`,
};

const defaultIconSvg = `<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>`;

/*
 * اصلاح اصلی:
 * در نسخه قبلی بعد از || هیچ مقدار پیش‌فرضی وجود نداشت.
 * اکنون در صورت نبودن keyName/categoryName رشته خالی استفاده می‌شود.
 */
const resolveCategoryIconPaths = (category) => {
  const key = String(category?.key_name || "").trim();
  const name = String(category?.name || "").trim();
  const storedIcon = category?.icon;

  if (key && catIconsByKey[key]) return catIconsByKey[key];
  if (name && catIcons[name]) return catIcons[name];

  if (typeof storedIcon === "string" && storedIcon.trim().startsWith("<")) {
    return storedIcon;
  }
  if (storedIcon && catIconsByKey[storedIcon]) return catIconsByKey[storedIcon];
  if (storedIcon && catIcons[storedIcon]) return catIcons[storedIcon];

  return defaultIconSvg;
};

function getBusinessImageUrl(imageUrl) {
  if (!imageUrl) return null;

  const value = String(imageUrl).trim();

  if (!value) return null;

  if (
    /^(https?:)?\/\//i.test(value) ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  return `${API_BASE}${value.startsWith("/") ? "" : "/"}${value}`;
}

function BusinessImage({
  src,
  alt = "",
  className = "",
  fallback = null,
}) {
  const [failed, setFailed] = React.useState(false);

  if (!src) return fallback;
  if (failed) return fallback;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
      decoding="async"
    />
  );
}

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

  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

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

  const [selectedProvince, setSelectedProvince] = useState(
    () => localStorage.getItem("selectedProvince") || "تهران"
  );

  const [selectedCity, setSelectedCity] = useState(
    () => localStorage.getItem("selectedCity") || "تهران"
  );

  useEffect(() => {
    fetch(`${API_BASE}/api/businesses`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setShops(data.data);
        }
      })
      .catch((err) =>
        console.error("خطا در دریافت کسب‌وکارها:", err)
      )
      .finally(() => setLoadingShops(false));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.data);
        }
      })
      .catch((err) =>
        console.error("خطا در دریافت دسته‌بندی‌ها:", err)
      )
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
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setHasOwnBusiness(data.count > 0);
        }
      })
      .catch((err) =>
        console.error("خطا در بررسی کسب‌وکار فروشنده:", err)
      )
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

      if (el) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 80);

    return () => clearTimeout(timer);
  }, [location.hash, loadingShops]);

  const sellerMenuItem = getSellerMenuItem(
    isLoggedIn,
    authUser,
    hasOwnBusiness
  );

  const SIDEBAR_NAV_ITEMS = getSidebarItems(
    sellerMenuItem,
    isLoggedIn
  );

  const BOTTOM_NAV_ITEMS = getBottomNavItems(
    sellerMenuItem,
    isLoggedIn
  );

  const logoImg = theme === "dark" ? logoWhite : logoBlack;

  const heroFeatured = shops.slice(0, 2);

  const visibleCategories = categories.slice(
    0,
    CAT_COLLAPSED_COUNT
  );

  const handleProvinceChange = (newProvince, firstCity) => {
    setSelectedProvince(newProvince);
    setSelectedCity(firstCity);
  };

  const handleSearch = () => {
    const q = query.trim();

    const cityParam = selectedCity
      ? `&city=${encodeURIComponent(selectedCity)}`
      : "";

    navigate(
      q
        ? `/search?q=${encodeURIComponent(q)}${cityParam}`
        : `/search?city=${encodeURIComponent(selectedCity)}`
    );
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleAuthToggle = () => {
    if (isLoggedIn) {
      if (
        window.confirm(
          "آیا مطمئن هستید که می‌خواهید خارج شوید؟"
        )
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("activeBusinessId");

        setAuthUser(null);
      }
    } else {
      navigate("/auth");
    }
  };

  const handleNavClick = (item) => {
    setActiveNav(item.key);

    if (item.path) {
      navigate(item.path);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) =>
      prev === "light" ? "dark" : "light"
    );
  };

  return (
    <div className={`lookavoo theme-${theme}`}>
      <div className="app-shell">
        <Sidebar
          items={SIDEBAR_NAV_ITEMS}
          activeNav={activeNav}
          onNavClick={handleNavClick}
          logoImg={logoImg}
        />

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
                  بیش از{" "}
                  <CountUpStat target={shops.length} /> کسب‌وکار فعال
                </div>

                <h1>
                  هر صنفی که بخوای، <span>اینجا</span> پیداش کن
                </h1>

                <p>
                  از نانوایی تا دفتر وکالت — همه‌ی کسب‌وکارهای شهر،
                  با آدرس دقیق و نظر واقعی مشتری‌ها، در یک جا.
                </p>
              </div>

              <div className="hero-visual">
                <div className="float-card">
                  <div className="fc-search">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="M21 21l-4.3-4.3" />
                    </svg>

                    نزدیک من
                  </div>

                  {heroFeatured.length === 0 ? (
                    <div className="fc-row">
                      <div className="fc-info">
                        <span>
                          {loadingShops
                            ? "در حال بارگذاری..."
                            : "هنوز کسب‌وکاری ثبت نشده"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    heroFeatured.map((s) => (
                      <div className="fc-row" key={s.id}>
                        <div
                          className="fc-ico"
                          style={{
                            background:
                              "linear-gradient(135deg,#2547E8,#5271FF)",
                            overflow: "hidden",
                            position: "relative",
                          }}
                        >
                          {getBusinessImageUrl(
                            s.images?.[0]?.image_url ||
                              s.image_url ||
                              s.primary_image_url
                          ) ? (
                            <BusinessImage
                              src={getBusinessImageUrl(
                                s.images?.[0]?.image_url ||
                                  s.image_url ||
                                  s.primary_image_url
                              )}
                              alt={s.name}
                              className="hero-business-img"
                              fallback={
                                <span aria-hidden="true">
                                  {s.category &&
                                  s.category.icon
                                    ? s.category.icon
                                    : "🏪"}
                                </span>
                              }
                            />
                          ) : (
                            <span aria-hidden="true">
                              {s.category && s.category.icon
                                ? s.category.icon
                                : "🏪"}
                            </span>
                          )}
                        </div>

                        <div className="fc-info">
                          <b>{s.name}</b>
                          <span>
                            {s.address || "آدرس ثبت نشده"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="badge-verified">
                  ✓ تایید شده توسط لوکاوو
                </div>
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

                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
              </div>

              {loadingCategories ? (
                <div className="cat-grid cat-grid-scroll">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      className="cat-card-skeleton"
                      key={i}
                    />
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="7"
                        height="7"
                        rx="1.5"
                      />
                      <rect
                        x="14"
                        y="3"
                        width="7"
                        height="7"
                        rx="1.5"
                      />
                      <rect
                        x="3"
                        y="14"
                        width="7"
                        height="7"
                        rx="1.5"
                      />
                      <rect
                        x="14"
                        y="14"
                        width="7"
                        height="7"
                        rx="1.5"
                      />
                    </svg>
                  </div>

                  <p>هنوز دسته‌بندی‌ای ثبت نشده است.</p>
                </div>
              ) : (
                <div className="cat-grid cat-grid-scroll">
                  {categories.map((c, i) => (
                    <div
                      className="cat-card"
                      key={c.id}
                      style={{
                        "--cat-color":
                          c.color_1 ||
                          fallbackCatColor(c.id),
                        "--i": i,
                      }}
                      onClick={() =>
                        navigate(
                          `/category/${c.key_name || c.id}`
                        )
                      }
                    >
                      <div
                        className="cat-watermark"
                        aria-hidden="true"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          dangerouslySetInnerHTML={{
                            __html: resolveCategoryIconPaths(c),
                          }}
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
                          dangerouslySetInnerHTML={{
                            __html: resolveCategoryIconPaths(c),
                          }}
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
                  Array.from({ length: 6 }).map((_, i) => (
                    <div
                      className="shop-card-skeleton"
                      key={i}
                    >
                      <div className="shop-card-skeleton-img" />

                      <div
                        className="shop-card-skeleton-line"
                        style={{ width: "70%" }}
                      />

                      <div
                        className="shop-card-skeleton-line"
                        style={{ width: "45%" }}
                      />
                    </div>
                  ))
                ) : shops.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 9l1.5-5h15L21 9" />
                        <path d="M3 9v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9" />
                        <path d="M3 9h18" />
                        <path d="M9 21v-6h6v6" />
                      </svg>
                    </div>

                    <p>هنوز کسب‌وکاری ثبت نشده است.</p>
                  </div>
                ) : (
                  shops.map((s) => (
                    <div
                      className="shop-card"
                      key={s.id}
                      style={{
                        "--glow-color": "#2547E840",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        navigate(`/businesses/${s.id}`)
                      }
                    >
                      <div className="shop-media">
                        {getBusinessImageUrl(
                          s.images?.[0]?.image_url ||
                            s.image_url ||
                            s.primary_image_url
                        ) ? (
                          <BusinessImage
                            src={getBusinessImageUrl(
                              s.images?.[0]?.image_url ||
                                s.image_url ||
                                s.primary_image_url
                            )}
                            alt={s.name}
                            className="shop-business-img"
                            fallback={
                              <div
                                className="shop-media-fallback"
                                aria-hidden="true"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.6"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M3 9l1-5h16l1 5" />
                                  <path d="M4 9v10h16V9" />
                                  <path d="M9 21v-6h6v6" />
                                </svg>
                              </div>
                            }
                          />
                        ) : (
                          <div
                            className="shop-media-fallback"
                            aria-hidden="true"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 9l1-5h16l1 5" />
                              <path d="M4 9v10h16V9" />
                              <path d="M9 21v-6h6v6" />
                            </svg>
                          </div>
                        )}

                        <span className="shop-badge">
                          تایید شده
                        </span>
                      </div>

                      <div className="shop-body">
                        <div>
                          <div className="shop-name">
                            {s.name}
                          </div>

                          <div className="shop-tag">
                            {s.category
                              ? s.category.name
                              : ""}
                          </div>
                        </div>

                        <div className="shop-meta">
                          <span
                            style={{
                              direction: "ltr",
                            }}
                          >
                            {s.phone}
                          </span>

                          <span>مشاهده →</span>
                        </div>

                        <div className="shop-addr">
                          {s.address}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      <Footer />

      <BottomNav
        items={BOTTOM_NAV_ITEMS}
        activeNav={activeNav}
        onNavClick={handleNavClick}
      />

      {/* دکمه شناور پشتیبانی */}
      <button
        type="button"
        className="support-fab"
        onClick={() => navigate("/support")}
        aria-label="پشتیبانی"
      >
        <span className="fab-pulse"></span>

        <svg
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M4 13a8 8 0 0 1 16 0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />

          <rect
            x="2.5"
            y="12"
            width="4"
            height="6"
            rx="2"
            fill="currentColor"
          />

          <rect
            x="17.5"
            y="12"
            width="4"
            height="6"
            rx="2"
            fill="currentColor"
          />

          <circle
            cx="12"
            cy="15"
            r="5"
            fill="#fff"
          />

          <circle
            cx="9.8"
            cy="15"
            r="1"
            fill="currentColor"
          />

          <circle
            cx="12"
            cy="15"
            r="1"
            fill="currentColor"
          />

          <circle
            cx="14.2"
            cy="15"
            r="1"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}