import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import Footer from "../components/Footer";
import { getSidebarItems, getBottomNavItems, getSellerMenuItem } from "../components/navConfig";
import { useTheme } from "../context/ThemeContext";
import logoBlack from "../assets/locavo-logo-black.png";
import logoWhite from "../assets/locavo-logo-white.png";

const API_BASE = "http://localhost:5000";

const catPalette = [
  "#FF7A45", "#2547E8", "#16A34A", "#8B5CF6", "#EC4899",
  "#F59E0B", "#06B6D4", "#EF4444", "#64748B", "#0EA5E9",
  "#D946EF", "#22C55E", "#F97316", "#6366F1", "#14B8A6",
];

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

const defaultIcon = `<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>`;
const toFa = (n) => n.toLocaleString("fa-IR");

const css = `
@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap');
.lokaoo-root *{ box-sizing:border-box; margin:0; padding:0; }
.lokaoo-root{
  font-family:'Vazirmatn', sans-serif;
  background:var(--bg); color:var(--text);
  transition: background .4s ease, color .4s ease;
  -webkit-font-smoothing:antialiased;
  overflow-x:hidden;
  min-height:100vh;
}
.lokaoo-root ::selection{ background:var(--primary); color:#fff; }
.lokaoo-root{ --radius-sm:10px; --radius-md:18px; --radius-lg:28px; }
@media (prefers-reduced-motion: reduce){ .lokaoo-root *{ animation:none !important; transition:none !important; } }
.lokaoo-root ::-webkit-scrollbar{ width:10px; }
.lokaoo-root ::-webkit-scrollbar-track{ background:transparent; }
.lokaoo-root ::-webkit-scrollbar-thumb{ background:var(--border); border-radius:20px; border:2px solid var(--bg); }
.app-shell{ display:flex; min-height:100vh; }
.sidebar{
  width:236px; flex-shrink:0; background:var(--surface);
  border-inline-start:1px solid var(--border);
  padding:24px 18px; display:flex; flex-direction:column; gap:30px;
}
.logo{ display:flex; align-items:center; gap:10px; padding:0 4px; }
.logo-img{ width:36px; height:36px; filter:drop-shadow(0 6px 14px rgba(37,71,232,.35)); object-fit:contain; }
.nav{ display:flex; flex-direction:column; gap:3px; }
.nav a{
  display:flex; align-items:center; gap:11px; padding:11px 13px; border-radius:var(--radius-sm);
  color:var(--text-muted); text-decoration:none; font-size:13.5px; font-weight:600; position:relative;
  transition:.18s; cursor:pointer;
}
.nav a svg{ width:18px; height:18px; }
.nav a.active{ background:var(--primary-tint); color:var(--primary); }
.nav a.active::before{ content:""; position:absolute; inset-inline-end:0; top:8px; bottom:8px; width:3px; border-radius:3px; background:var(--primary); }
.nav a:not(.active):hover{ background:var(--card); color:var(--text); transform:translateX(-2px); }
.sidebar-footer{ margin-top:auto; display:flex; flex-direction:column; gap:10px; }
.bdp-mobile-logo{
  display:none;
  height:34px;
  width:auto;
  flex-shrink:0;
}
@media (max-width:980px){
  .bdp-mobile-logo{ display:block; }
}
@media (max-width:520px){
  .bdp-mobile-logo{ height:30px; }
}
.main{ flex:1; min-width:0; }
.bdp-topbar{
  display:flex; align-items:center; gap:14px; padding:18px 30px;
  border-bottom:1px solid var(--border); position:sticky; top:0; z-index:20;
  background:color-mix(in srgb, var(--bg) 70%, transparent);
  backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
}
.bdp-back-btn{
  display:flex; align-items:center; gap:8px; padding:11px 16px; border-radius:999px;
  background:var(--card); border:1px solid var(--border); font-size:13px; color:var(--text);
  white-space:nowrap; font-weight:700; cursor:pointer; transition:.18s;
}
.bdp-back-btn:hover{ border-color:var(--primary); color:var(--primary); }
.bdp-back-btn svg{ width:15px; height:15px; }
.bdp-crumbs{
  flex:1; min-width:0; display:flex; align-items:center; gap:7px;
  font-size:12.5px; color:var(--text-muted); font-weight:600;
  overflow:hidden; white-space:nowrap; text-overflow:ellipsis;
}
  .bdp-title{
  flex:1;
  min-width:0;
  text-align:center;
  font-size:14px;
  font-weight:900;
  color:var(--text);
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  padding:0 8px;
}
.bdp-crumbs b{ color:var(--text); font-weight:800; }
.bdp-crumbs .sep{ opacity:.5; }
.bdp-icon-btn{
  width:36px; height:36px; border-radius:50%; border:1px solid var(--border);
  background:var(--surface); display:flex; align-items:center; justify-content:center;
  color:var(--text-muted); flex-shrink:0; cursor:pointer; position:relative; transition:.2s ease;
}
.bdp-icon-btn svg{ width:17px; height:17px; }
.bdp-icon-btn:hover{ color:var(--primary); border-color:var(--primary); transform:translateY(-1px); }
.bdp-icon-btn.is-active, .bdp-icon-btn.saved{ color:var(--accent); border-color:var(--accent); }
.content{ padding:32px; display:flex; flex-direction:column; gap:28px; max-width:1300px; }.bottom-nav{
  display:none; position:fixed; inset-inline:0; bottom:0; z-index:40;
  background:var(--surface); border-top:1px solid var(--border);
  padding:8px 6px calc(8px + env(safe-area-inset-bottom));
  align-items:center; justify-content:space-around;
}
.bottom-nav a{
  display:flex; flex-direction:column; align-items:center; gap:3px;
  color:var(--text-muted); text-decoration:none; font-size:10.5px; font-weight:700;
  padding:6px 8px; border-radius:12px; transition:.18s; flex:1; min-width:0;
}
.bottom-nav a svg{ width:20px; height:20px; }
.bottom-nav a.active{ color:var(--primary); }
.bottom-nav a span{ white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
.page-head{ display:flex; flex-direction:column; gap:6px; }
.page-head h1{ font-size:26px; font-weight:900; letter-spacing:-.2px; }
.page-head p{ font-size:13px; color:var(--text-muted); margin-top:6px; font-weight:600; }
.cat-toolbar{ display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.cat-filter{
  flex:1; min-width:240px; max-width:420px; display:flex; align-items:center; gap:8px;
  background:var(--surface); border:1.5px solid var(--border); border-radius:999px;
  padding:11px 16px; transition:.2s;
}
.cat-filter:focus-within{ border-color:var(--primary); box-shadow:0 0 0 4px var(--primary-tint); }
.cat-filter svg{ color:var(--text-muted); flex-shrink:0; width:16px; height:16px; }
.cat-filter input{ flex:1; border:none; outline:none; background:transparent; font-family:inherit; font-size:13.5px; color:var(--text); }
.cat-filter input::placeholder{ color:var(--text-muted); }
.count-pill{ font-size:11.5px; font-weight:800; color:var(--primary); background:var(--primary-tint); padding:5px 13px; border-radius:999px; white-space:nowrap; }
.cat-grid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(158px,1fr)); gap:12px; }
.cat-card{
  position:relative; overflow:hidden; isolation:isolate;
  background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-md);
  padding:20px 14px 17px; min-height:118px;
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:11px; text-align:center;
  cursor:pointer; user-select:none;
  transition:transform .28s cubic-bezier(.2,.8,.2,1), box-shadow .28s ease, border-color .28s ease, background .28s ease;
  opacity:0; transform:translateY(16px) scale(.94);
  animation:catIn .5s cubic-bezier(.2,.8,.2,1) forwards;
}
@keyframes catIn{ to{ opacity:1; transform:translateY(0) scale(1); } }
.cat-card::before{
  content:""; position:absolute; inset-inline:0; top:0; height:3px;
  background:var(--cat-color); transform:scaleX(0); transform-origin:center;
  transition:transform .35s cubic-bezier(.3,.9,.3,1);
}
.cat-card::after{
  content:""; position:absolute; inset:-40%; z-index:-1;
  background:linear-gradient(115deg, transparent 40%, color-mix(in srgb, var(--cat-color) 22%, transparent) 50%, transparent 60%);
  transform:translateX(-120%); transition:transform .6s ease;
}
.cat-card:hover{
  transform:translateY(-6px) scale(1.035);
  border-color:color-mix(in srgb, var(--cat-color) 55%, var(--border));
  background:color-mix(in srgb, var(--cat-color) 6%, var(--surface));
  box-shadow:0 18px 32px -18px var(--cat-color);
}
.cat-card:hover::before{ transform:scaleX(1); }
.cat-card:hover::after{ transform:translateX(120%); }
.cat-card:active{ transform:translateY(-2px) scale(.98); }
.cat-card span{ font-size:12.5px; font-weight:700; line-height:1.6; color:var(--text); transition:color .2s; position:relative; z-index:1; }
.cat-card:hover span{ color:color-mix(in srgb, var(--cat-color) 75%, var(--text)); }
.cat-watermark{
  position:absolute; inset-inline-end:-14px; bottom:-16px; width:84px; height:84px;
  color:var(--cat-color); opacity:.09; transform:rotate(-10deg); pointer-events:none;
  transition:transform .4s cubic-bezier(.2,.8,.2,1), opacity .4s ease;
}
.cat-watermark svg{ width:100%; height:100%; }
.cat-card:hover .cat-watermark{ transform:rotate(-4deg) scale(1.18); opacity:.16; }
.cat-icon-badge{
  position:relative; z-index:1; width:46px; height:46px; border-radius:15px;
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
  background:color-mix(in srgb, var(--cat-color) 14%, transparent);
  transition:transform .3s cubic-bezier(.2,.8,.2,1), background .3s ease;
}
.cat-icon-badge svg{ width:22px; height:22px; color:var(--cat-color); }
.cat-card:hover .cat-icon-badge{ transform:scale(1.12) rotate(-6deg); background:color-mix(in srgb, var(--cat-color) 22%, transparent); }
.cat-empty{
  grid-column:1/-1; text-align:center; padding:60px 10px; color:var(--text-muted);
  font-size:13px; font-weight:600; opacity:0; animation:fadeUp .4s ease forwards;
}
@keyframes fadeUp{ from{ opacity:0; transform:translateY(14px);} to{ opacity:1; transform:translateY(0);} }
@media (max-width:980px){
  .cat-grid{ grid-template-columns:repeat(3,1fr); }
  .sidebar{ display:none; }
  .bottom-nav{ display:flex; }
  .content{ padding-bottom:88px; }
  .cat-toolbar{ flex-direction:column; align-items:stretch; }
  .cat-filter{ max-width:100%; }
  .page-head{ align-items:center; text-align:center; }
  .page-head h1{ text-align:center; }
  .page-head p{ text-align:center; }
}
@media (max-width:760px){
  .bdp-topbar{ padding:12px; gap:8px; }
}
@media (max-width:520px){
  .cat-grid{ grid-template-columns:repeat(2,1fr); }
  .bdp-topbar{ display:flex; align-items:center; gap:6px; padding:10px 12px; flex-wrap:nowrap; overflow:hidden; }
  .bdp-back-btn{ flex-shrink:0; height:32px; padding:0 10px; font-size:10.5px; border-radius:999px; gap:4px; }
  .bdp-back-btn svg{ width:12px; height:12px; }
  .bdp-icon-btn{ width:32px; height:32px; flex-shrink:0; border-radius:50%; }
  .bdp-icon-btn svg{ width:15px; height:15px; }
  .bdp-crumbs{ flex:1; min-width:0; display:flex; align-items:center; gap:4px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; font-size:10.5px; }
  .bdp-crumbs b{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:10.5px; }
  .bdp-crumbs .sep{ opacity:.45; flex-shrink:0; }
}
`;

function CatIconSvg({ icon, className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: icon }}
    />
  );
}

function CatWatermarkSvg({ icon }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: icon }}
    />
  );
}

export default function LokaooCategories() {
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const [fav, setFav] = useState(false);
  const [saved, setSaved] = useState(false);
  const [rawFilter, setRawFilter] = useState("");
  const [filter, setFilter] = useState("");
  const [activeNav, setActiveNav] = useState("categories");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);

  const [authUser] = useState(() => {
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

  useEffect(() => {
    if (!isLoggedIn || authUser?.role !== "seller") {
      setHasOwnBusiness(false);
      return;
    }
    const token = localStorage.getItem("token");
    fetch(`${API_BASE}/api/businesses/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setHasOwnBusiness(data.count > 0);
      })
      .catch((err) => console.error("خطا در بررسی کسب‌وکار فروشنده:", err));
  }, [isLoggedIn, authUser]);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/categories`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          const mapped = (json.data || []).map((cat, i) => ({
            id: cat.id,
            key_name: cat.key_name,
            name: cat.name,
            icon: catIcons[cat.name] || defaultIcon,
            color: cat.color_1 || catPalette[i % catPalette.length],
            emoji: cat.icon,
          }));
          setCategories(mapped);
        }
      })
      .catch((err) => console.error("خطا در دریافت دسته‌بندی‌ها:", err))
      .finally(() => setLoading(false));
  }, []);

  const sellerMenuItem = useMemo(
    () => getSellerMenuItem(isLoggedIn, authUser, hasOwnBusiness),
    [isLoggedIn, authUser, hasOwnBusiness]
  );
  const sidebarItems = useMemo(
    () => getSidebarItems(sellerMenuItem, isLoggedIn),
    [sellerMenuItem, isLoggedIn]
  );
  const bottomNavItems = useMemo(
    () => getBottomNavItems(sellerMenuItem, isLoggedIn),
    [sellerMenuItem, isLoggedIn]
  );

  const logoImg = isDark ? logoWhite : logoBlack;

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setFilter(rawFilter), 90);
    return () => clearTimeout(debounceRef.current);
  }, [rawFilter]);

  const filteredCategories = useMemo(() => {
    const q = filter.trim();
    return q ? categories.filter((c) => c.name.includes(q)) : categories;
  }, [filter, categories]);

  const handleNavClick = (item) => {
    setActiveNav(item.key);
    if (item.path) navigate(item.path);
  };

  const handleCategoryClick = (cat) => {
    navigate(`/category/${cat.key_name}`);
  };

  return (
    <div className="lokaoo-root" dir="rtl" lang="fa">
      <style>{css}</style>
      <div className="app-shell">
        <Sidebar
          items={sidebarItems}
          activeNav={activeNav}
          onNavClick={handleNavClick}
          logoImg={logoImg}
          logoAlt="لوکاوو"
        />
        <div className="main">
          <div className="bdp-topbar">
            <img src={logoImg} alt="لوکاوو" className="bdp-mobile-logo" />
            <button className="bdp-back-btn" onClick={() => navigate("/")}>
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

            <div className="bdp-title">همه دسته‌بندی‌ها</div>

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

            <button className={`bdp-icon-btn ${saved ? "is-active" : ""}`} onClick={() => setSaved((v) => !v)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 4h12v17l-6-4-6 4V4Z" />
              </svg>
            </button>

            <button className={`bdp-icon-btn ${fav ? "saved" : ""}`} onClick={() => setFav((v) => !v)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="6" cy="12" r="2.2" />
                <circle cx="18" cy="6" r="2.2" />
                <circle cx="18" cy="18" r="2.2" />
                <path d="M8 11l8-4M8 13l8 4" />
              </svg>
            </button>
          </div>

          <div className="content">
            <div className="cat-toolbar">
              <div className="cat-filter">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
                <input
                  value={rawFilter}
                  onChange={(e) => setRawFilter(e.target.value)}
                  placeholder="جستجو در دسته‌بندی‌ها..."
                />
              </div>
              <span className="count-pill">{toFa(filteredCategories.length)} دسته</span>
            </div>

            <div className="cat-grid">
              {loading ? (
                <div className="cat-empty">در حال دریافت دسته‌بندی‌ها...</div>
              ) : filteredCategories.length === 0 ? (
                <div className="cat-empty">چیزی با این عنوان پیدا نشد</div>
              ) : (
                filteredCategories.map((c, i) => (
                  <div
                    key={c.key_name || c.id}
                    className="cat-card"
                    style={{ "--cat-color": c.color, animationDelay: `${i * 22}ms` }}
                    onClick={() => handleCategoryClick(c)}
                  >
                    <div className="cat-watermark">
                      <CatWatermarkSvg icon={c.icon} />
                    </div>
                    <div className="cat-icon-badge">
                      <CatIconSvg icon={c.icon} />
                    </div>
                    <span>{c.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <Footer />
        </div>
      </div>

      <BottomNav items={bottomNavItems} activeNav={activeNav} onNavClick={handleNavClick} />
    </div>
  );
}