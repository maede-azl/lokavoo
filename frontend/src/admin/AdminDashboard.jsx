import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import "./AdminDashboard.css";
import logoBlack from "../assets/locavo-logo-black.png";
import logoWhite from "../assets/locavo-logo-white.png";
import api from "../api";

function uid() {
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
}

/* ===== رنگ و حروف اول برای نمایش آواتار، بر اساس نام (چون در دیتابیس ذخیره نمی‌شود) ===== */
const AVATAR_PALETTE = ["#2547E8", "#BE185D", "#FF9736", "#0D9488", "#7C3AED", "#DC2626", "#5271FF", "#0891B2"];
function colorForName(name) {
  const str = String(name || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}
function initialsForName(name) {
  const clean = String(name || "؟").trim();
  return clean.slice(0, 2) || "؟";
}
function relativeFa(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "همین الان";
  if (diffMin < 60) return `${fa(diffMin)} دقیقه پیش`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${fa(diffH)} ساعت پیش`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "دیروز";
  if (diffD < 7) return `${fa(diffD)} روز پیش`;
  return d.toLocaleDateString("fa-IR");
}

/* ===== نگاشت داده‌های واقعی بک‌اند به شکلی که کامپوننت‌های پنل ادمین انتظار دارند ===== */
function mapBusinessToSeller(b) {
  return {
    id: b.id,
    name: b.name,
    owner: b.user?.name || b.user?.phone || "—",
    category: b.category?.name || "—",
    city: b.city || b.address || "—",
    color: colorForName(b.name),
    initials: initialsForName(b.name),
    status: b.status,
    banner: !!b.has_banner_access,
    submitted: relativeFa(b.created_at),
  };
}
function mapUserToRow(u) {
  const roleLabel = u.role === "seller" ? "صاحب فروشگاه" : u.role === "admin" ? "ادمین" : "کاربر عادی";
  return {
    id: u.id,
    name: u.name || u.phone || "—",
    email: u.email || u.phone || "—",
    joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString("fa-IR") : "—",
    role: roleLabel,
    rawRole: u.role,
    color: colorForName(u.name || u.phone),
    initials: initialsForName(u.name || u.phone),
    status: u.status,
  };
}
function mapCategoryRow(c) {
  return {
    id: c.id,
    key_name: c.key_name,
    icon: c.icon || null,
    emoji: null,
    name: c.name,
    count: c._count?.businesses ?? c.count ?? 0,
  };
}
function mapProductRow(p) {
  return {
    id: p.id,
    name: p.name,
    seller: p.business?.name || "—",
    category: p.category || "—",
    price: p.price || 0,
    status: p.active ? "active" : "hidden",
  };
}
function mapPromoRow(p) {
  return {
    id: p.id,
    seller: p.business?.name || "—",
    type: p.type,
    price: p.price,
    days: p.days,
    status: p.status,
    visible: p.visible,
    color: colorForName(p.business?.name),
    initials: initialsForName(p.business?.name),
    date: p.created_at ? new Date(p.created_at).toLocaleDateString("fa-IR") : "",
  };
}
function mapThreadRow(t) {
  const roleLabel = t.user?.role === "seller" ? "فروشنده" : t.user?.role === "admin" ? "ادمین" : "کاربر عادی";
  return {
    id: t.id,
    userId: t.user_id,
    name: t.user?.name || t.user?.phone || "کاربر",
    role: roleLabel,
    color: colorForName(t.user?.name),
    initials: initialsForName(t.user?.name),
    unread: t.unread || 0,
    messages: (t.messages || []).map((m) => ({
      id: m.id,
      from: m.sender === "admin" ? "admin" : "user",
      text: m.text,
      time: m.created_at
        ? new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(new Date(m.created_at))
        : "",
    })),
  };
}


/* ===== داده پیش‌فرض فوتر ===== */
const initialFooterData = {
  brand: { description: "مرجع پیدا کردن کسب‌وکارهای محلی؛ از نانوایی محله تا دفتر وکالت، همراه با آدرس دقیق، اطلاعات کامل و نظرات واقعی کاربران.", social: { instagram: "#", telegram: "#", x: "#" } },
  columns: [],
  bottomMade: "ساخته شده با ❤ برای کسب‌وکارهای محلی",
};


/* ===== سیستم آیکون دسته‌بندی — همسان با صفحه Categories ===== */
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
  "hotel": `<path d="M3 19v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8"/><path d="M3 14h18"/><path d="M7 14v-2a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v2"/><path d="M3 19v2M21 19v2"/>`,
  "medical": `<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>`,
  "pharmacy": `<rect x="2" y="9" width="20" height="6" rx="3"/><path d="M12 9v6"/>`,
  "beauty": `<circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><path d="M20 4L8.5 15.5M20 20L8.5 8.5"/>`,
  "spa": `<path d="M12 2c4.2 4.2 7 8.3 7 12.2A7 7 0 0 1 5 14.2C5 10.3 7.8 6.2 12 2Z"/>`,
  "gym": `<path d="M4 9v6M2 10v4M20 9v6M22 10v4"/><path d="M7 12h10"/><path d="M4 12h0M20 12h0"/>`,
  "education": `<path d="M2 8l10-5 10 5-10 5-10-5Z"/><path d="M6 11v5c2 2 10 2 12 0v-5"/>`,
  "supermarket": `<circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M2 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L21 7H6"/>`,
  "clothing": `<path d="M8 3l4 2 4-2 4 4-3 3v10H7V10L4 7Z"/>`,
  "jewelry": `<path d="M6 3h12l4 6-10 12L2 9Z"/><path d="M2 9h20M9 3l3 6-3 12M15 3l-3 6 3 12"/>`,
  "mobile": `<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>`,
  "computer": `<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>`,
  "car-showroom": `<path d="M3 13l2-6h14l2 6"/><rect x="3" y="13" width="18" height="6" rx="1"/><circle cx="7.5" cy="19" r="1.5"/><circle cx="16.5" cy="19" r="1.5"/>`,
  "car-repair": `<path d="M21 7a4 4 0 0 1-5.7 3.6L6.7 20 4 17.3l9.4-9.3A4 4 0 1 1 21 7Z"/>`,
  "car-services": `<path d="M12 2s6 6.8 6 11.5a6 6 0 0 1-12 0C6 8.8 12 2 12 2Z"/>`,
  "bank": `<path d="M3 10l9-6 9 6"/><path d="M4 10v9M9 10v9M15 10v9M20 10v9"/><path d="M2 21h20"/>`,
  "real-estate": `<path d="M4 21V10l8-6 8 6v11"/><path d="M9 21v-6h6v6"/>`,
  "lawyer": `<path d="M12 3v18M6 21h12"/><path d="M3 7l4-3 4 3-4 4-4-4Z"/><path d="M13 7l4-3 4 3-4 4-4-4Z"/>`,
  "photography": `<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l2-3h4l2 3"/><circle cx="12" cy="13.5" r="3.4"/>`,
  "event-hall": `<path d="M12 3l1.6 4.6L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.4Z"/><path d="M4 20h16"/>`,
  "florist": `<circle cx="12" cy="12" r="2.3"/><circle cx="12" cy="5" r="2.3"/><circle cx="12" cy="19" r="2.3"/><circle cx="5" cy="12" r="2.3"/><circle cx="19" cy="12" r="2.3"/>`,
  "gift-handicraft": `<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 9V6h18v3"/><path d="M12 6v15"/><path d="M12 6c-2 0-4.5-1-4.5-3s2.5-2 4.5 0c2-2 4.5-2 4.5 0s-2.5 3-4.5 3Z"/>`,
  "pet-services": `<circle cx="7" cy="8" r="1.5"/><circle cx="11" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="18.5" cy="9" r="1.5"/><path d="M12 12c-3.8 0-6 2.3-6 4.8a3 3 0 0 0 6 1 3 3 0 0 0 6-1c0-2.5-2.2-4.8-6-4.8Z"/>`,
  "technical-services": `<path d="M14 7l3 3-8 8-3-3 8-8Z"/><path d="M17 4l3 3-2 2-3-3 2-2Z"/>`,
  "cleaning": `<path d="M6 21l9-9M15 6l3 3M18 3l3 3"/>`,
  "transport": `<rect x="1" y="7" width="13" height="9" rx="1"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>`,
  "travel-agency": `<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7Z"/>`,
  "religious": `<path d="M12 2a5 5 0 0 1 5 5v2H7V7a5 5 0 0 1 5-5Z"/><path d="M4 21V13h16v8"/><path d="M12 13V9"/>`,
  "cultural": `<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2s-1-1.4-1-2.3 1-1.4 2-1.4h2.3A3.7 3.7 0 0 0 21 11.5C21 6.8 17 3 12 3Z"/><circle cx="7.5" cy="10.5" r="1.2"/><circle cx="11" cy="7.5" r="1.2"/><circle cx="15.5" cy="8.5" r="1.2"/>`,
  "cinema": `<rect x="3" y="8" width="18" height="13" rx="1"/><path d="M3 8l2-4h4l-2 4M11 8l2-4h4l-2 4"/>`,
  "tourism": `<path d="M2 20l7-12 4 6 3-4 6 10Z"/>`,
  "print-ads": `<rect x="4" y="9" width="16" height="8" rx="1"/><path d="M7 9V4h10v5M7 17v4h10v-4"/>`,
  "factory": `<path d="M3 21V11l5 3v-3l5 3V8l5 3v10Z"/>`,
  "Bakery": `<path d="M4 11c0-3.5 2.5-6 4.5-6h7c2 0 4.5 2.5 4.5 6v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7Z"/><path d="M8 5v3M12 5v3M16 5v3"/><path d="M6 15h12"/>`,
  "fruit": `<path d="M12 2c-4 0-7 3-7 7 0 2.5 1.5 4.5 3.5 5.5L7 20h10l-1.5-5.5C17.5 13.5 19 11.5 19 9c0-4-3-7-7-7Z"/><path d="M12 2v3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/>`,
  "other": `<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>`,
  // اضافه کردن دسته‌های فعلی ادمین
  "cafe": `<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/>`,
  "dry-fruit": `<path d="M12 2c-4 0-7 3-7 7 0 2.5 1.5 4.5 3.5 5.5L7 20h10l-1.5-5.5C17.5 13.5 19 11.5 19 9c0-4-3-7-7-7Z"/><path d="M12 2v3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/>`,
  "atelier": `<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l2-3h4l2 3"/><circle cx="12" cy="13.5" r="3.4"/>`,
  "restaurant": `<path d="M6 2v8a2 2 0 0 0 2 2v10"/><path d="M6 2v6M9 2v6"/><path d="M17 2c-2.2 0-3 3-3 6.5S15 13 17 13v9"/>`,
  "confectionery": `<path d="M4 11c0-3.5 2.5-6 4.5-6h7c2 0 4.5 2.5 4.5 6v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7Z"/><path d="M8 5v3M12 5v3M16 5v3"/><path d="M6 15h12"/>`,
};

const defaultIconSvg = `<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>`;

const ICON_OPTIONS = Object.keys(catIconsByKey).map((key, index) => {
  const matched = Object.entries(catIcons).find(([, value]) => value === catIconsByKey[key]);
  return {
    key,
    label: matched?.[0] || key,
    emoji: "📦",
    color: [
      "#FF7A45", "#2547E8", "#16A34A", "#8B5CF6", "#EC4899",
      "#F59E0B", "#06B6D4", "#EF4444", "#64748B", "#0EA5E9",
      "#D946EF", "#22C55E", "#F97316", "#6366F1", "#14B8A6",
    ][index % 15],
  };
});

function CatIconSvg({ icon, size = 24, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: icon || defaultIconSvg }}
    />
  );
}

function resolveCategoryIcon(category) {
  const key = category?.key_name || "";
  const name = category?.name || "";
  const storedIcon = category?.icon || "";

  if (key && catIconsByKey[key]) {
    return { type: "svg", value: catIconsByKey[key] };
  }

  if (name && catIcons[name]) {
    return { type: "svg", value: catIcons[name] };
  }

  if (typeof storedIcon === "string" && storedIcon.trim().startsWith("<")) {
    return { type: "svg", value: storedIcon };
  }

  if (storedIcon && catIconsByKey[storedIcon]) {
    return { type: "svg", value: catIconsByKey[storedIcon] };
  }

  if (category?.emoji) {
    return { type: "emoji", value: category.emoji };
  }

  return { type: "svg", value: defaultIconSvg };
}

/* ===== admin-data.js ===== */
const fa = (n) =>
  String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)] ?? d);

const faNum = (n) => fa(n.toLocaleString("en-US"));

/* ===== icons.jsx ===== */
const s = (props) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  ...props,
});

const IconDashboard = (p) => (
  <svg {...s(p)}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);

const IconStore = (p) => (
  <svg {...s(p)}>
    <path d="M3 21h18M5 21V7l6-4 6 4v14M9 9h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1" />
  </svg>
);

const IconUsers = (p) => (
  <svg {...s(p)}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconClick = (p) => (
  <svg {...s(p)}>
    <path d="M9 9l11-4-4 11-2.5-4.5L9 9z" />
  </svg>
);

const IconMegaphone = (p) => (
  <svg {...s(p)}>
    <path d="M3 11l18-5v12L3 14v-3z" />
    <path d="M11.6 16.9a2 2 0 0 1-3.8-1.1" />
  </svg>
);

const IconWallet = (p) => (
  <svg {...s(p)}>
    <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3" />
    <path d="M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-4" />
    <path d="M17 12h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-3a2 2 0 0 1 0-4z" />
  </svg>
);

const IconGrid = (p) => (
  <svg {...s(p)}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const IconBox = (p) => (
  <svg {...s(p)}>
    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const IconChat = (p) => (
  <svg {...s(p)}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconFooterMenu = (p) => (
  <svg {...s(p)}>
    <rect x="3" y="3" width="18" height="12" rx="2" />
    <path d="M3 17h18M3 21h18" />
  </svg>
);

const IconSettings = (p) => (
  <svg {...s(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.36.4.66.73.85.24.14.5.22.78.24H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconSearch = (p) => (
  <svg {...s(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const IconCheck = (p) => (
  <svg {...s({ strokeWidth: 2.5, ...p })}>
    <path d="m20 6-11 11-5-5" />
  </svg>
);

const IconX = (p) => (
  <svg {...s({ strokeWidth: 2.5, ...p })}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const IconEye = (p) => (
  <svg {...s(p)}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = (p) => (
  <svg {...s(p)}>
    <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M6.6 6.6A18.5 18.5 0 0 0 1 12s4 8 11 8a9 9 0 0 0 5.4-1.6" />
    <path d="M2 2l20 20" />
  </svg>
);

const IconEdit = (p) => (
  <svg {...s(p)}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
  </svg>
);

const IconTrash = (p) => (
  <svg {...s(p)}>
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
  </svg>
);

const IconChevron = (p) => (
  <svg {...s({ strokeWidth: 2.5, ...p })}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const IconChevronLeft = (p) => (
  <svg {...s({ strokeWidth: 2.5, ...p })}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const IconPin = (p) => (
  <svg {...s(p)}>
    <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconCalendar = (p) => (
  <svg {...s(p)}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const IconPhone = (p) => (
  <svg {...s(p)}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconBolt = (p) => (
  <svg {...s(p)}>
    <path d="M13.5 2 3 14h7l-1.5 8L20 10h-7l1.5-8z" />
  </svg>
);

const IconBell = (p) => (
  <svg {...s(p)}>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconSun = (p) => (
  <svg {...s(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

const IconMoon = (p) => (
  <svg {...s(p)}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
  </svg>
);

const IconSend = (p) => (
  <svg {...s(p)}>
    <path d="m22 2-7 20-4-9-9-4 20-7z" />
  </svg>
);

const IconPlus = (p) => (
  <svg {...s({ strokeWidth: 2.5, ...p })}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const IconMenu = (p) => (
  <svg {...s(p)}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </svg>
);

const IconPause = (p) => (
  <svg {...s(p)}>
    <path d="M10 4v16M14 4v16" />
  </svg>
);

const IconMoney = (p) => (
  <svg {...s(p)}>
    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconTrendUp = (p) => (
  <svg {...s({ strokeWidth: 2.5, ...p })}>
    <path d="m18 15-6-6-6 6" />
  </svg>
);

const IconImage = (p) => (
  <svg {...s({ strokeWidth: 1.6, ...p })}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="m21 15-5-5L5 21" />
  </svg>
);

const IconHome = (p) => (
  <svg {...s(p)}>
    <path d="m3 11 9-8 9 8" />
    <path d="M5 10v10a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1V10" />
  </svg>
);

const IconLogout = (p) => (
  <svg {...s(p)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

const IconUpload = (p) => (
  <svg {...s({ strokeWidth: 1.8, ...p })}>
    <path d="M12 16V4M7 9l5-5 5 5" />
    <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </svg>
);

/* ===== Dropdown.jsx ===== */

function Dropdown({
  options,
  value,
  onChange,
  placeholder = "انتخاب کنید",
  searchable = false,
  searchPlaceholder = "جستجو…",
  minWidth,
  clearable = false,
  clearValue = "all",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    if (!searchable || !q.trim()) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase()));
  }, [options, q, searchable]);

  return (
        <div className={"dd" + (open ? " open" : "") + (className ? " " + className : "")} ref={ref} style={minWidth ? { minWidth } : undefined}>
      <button
        type="button"
        className="dd-btn"
        onClick={() => {
          setOpen((v) => !v);
          setQ("");
        }}
      >
        {selected?.color ? <span className="dd-swatch" style={{ background: selected.color }} /> : null}
        <span className="dd-label">{selected ? selected.label : placeholder}</span>
        {selected?.hint ? <span className="dd-hint">{selected.hint}</span> : null}
        <IconChevron className="dd-chev" />
      </button>

      {clearable && value !== clearValue ? (
        <span
          role="button"
          tabIndex={0}
          className="dd-clear"
          title="حذف فیلتر"
          onClick={(e) => {
            e.stopPropagation();
            onChange(clearValue);
            setOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onChange(clearValue);
          }}
        >
          ×
        </span>
      ) : null}

      {open ? (
        <div className="dd-menu">
          {searchable ? (
            <div className="dd-search">
              <IconSearch />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={searchPlaceholder}
              />
            </div>
          ) : null}

          {filtered.length === 0 ? (
            <div className="dd-empty">موردی پیدا نشد</div>
          ) : (
            filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                className={"dd-item" + (o.value === value ? " selected" : "")}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                {o.color ? <span className="dd-swatch" style={{ background: o.color }} /> : null}
                <span>{o.label}</span>
                {o.hint ? <span className="dd-hint">{o.hint}</span> : null}
                <IconCheck className="dd-check" />
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ===== views.jsx ===== */

/* ------------ shared bits ------------ */

const sellerStatusMeta = {
  pending: { label: "در انتظار", cls: "pending" },
  approved: { label: "فعال", cls: "approved" },
  suspended: { label: "تعلیق‌شده", cls: "rejected" },
  rejected: { label: "رد شده", cls: "rejected" },
};

function Pill({ cls, label }) {
  return (
    <span className={"status-pill " + cls}>
      <span className="status-dot" />
      {label}
    </span>
  );
}

function Switch({ on, onClick }) {
  return <button type="button" className={"switch" + (on ? " on" : "")} onClick={onClick} aria-pressed={on} />;
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="filter-search">
      <IconSearch />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function ResetFilters({ show, onReset }) {
  if (!show) return null;
  return (
    <button className="btn btn-ghost" style={{ padding: "8px 12px", fontSize: 12 }} onClick={onReset}>
      <IconX style={{ width: 13, height: 13 }} />
      پاک کردن فیلترها
    </button>
  );
}

function RangePill({ value, onChange, options }) {
  return (
    <div className="range-pill">
      {options.map((o) => (
        <button key={o.value} className={value === o.value ? "active" : ""} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------ dashboard ------------ */

function DashboardView({ sellers, stats, onGoto, onSellerStatus }) {
  const pending = sellers.filter((s) => s.status === "pending");
  const active = sellers.filter((s) => s.status === "approved");

  return (
    <section className="view">
      <div className="hero">
        <div className="mesh">
          <span className="m1" />
          <span className="m2" />
        </div>
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="pulse" /> {fa(pending.length)} درخواست تازه در صف بررسی
          </div>
          <h2>
            سلام مدیر، بیا یه نگاه به <span>وضعیت امروز</span> بندازیم
          </h2>
          <p>
            فروشگاه‌های تازه ثبت‌شده رو بررسی کن، کلیک‌های ثبت‌شده برای صورتحساب رو زیر نظر داشته باش و در چند کلیک
            همه‌چیز رو مدیریت کن.
          </p>
        </div>
        <div className="hero-visual">
          <div className="float-card">
            <div className="fc-head">جدیدترین درخواست‌ها</div>
            {pending.slice(0, 2).map((s) => (
              <div className="fc-row" key={s.id}>
                <div className="fc-ico" style={{ background: s.color }}>
                  {s.initials}
                </div>
                <div className="fc-info">
                  <b>{s.name}</b>
                  <span>
                    {s.category} · {s.city}
                  </span>
                </div>
                <div className="fc-tag">جدید</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        {[
          { icon: <IconUsers />, tint: "var(--primary-tint)", color: "var(--primary)", v: faNum(stats?.totalUsers ?? 0), l: "کل کاربران", t: "" },
          { icon: <IconStore />, tint: "color-mix(in srgb, var(--ok) 16%, transparent)", color: "var(--ok)", v: fa(active.length), l: "فروشگاه فعال", t: "" },
          { icon: <IconCalendar />, tint: "color-mix(in srgb, var(--accent) 16%, transparent)", color: "var(--accent)", v: fa(pending.length), l: "در انتظار تأیید", t: "" },
          { icon: <IconClick />, tint: "#FCE9F1", color: "#BE185D", v: faNum(stats?.totalProducts ?? 0), l: "کل محصولات ثبت‌شده", t: "" },
        ].map((k) => (
          <div className="card kpi-card" key={k.l}>
            <div className="kpi-top">
              <div className="kpi-icon" style={{ background: k.tint, color: k.color }}>
                {k.icon}
              </div>
              {k.t ? (
                <div className="kpi-trend" style={{ color: "var(--ok)" }}>
                  <IconTrendUp /> {k.t}
                </div>
              ) : null}
            </div>
            <div className="kpi-value">{k.v}</div>
            <div className="kpi-label">{k.l}</div>
          </div>
        ))}
      </div>

      <div className="section-head">
        <div>
          <h3>درخواست‌های در انتظار تأیید</h3>
          <div className="section-sub">فروشگاه‌هایی که نیاز به بررسی دارند</div>
        </div>
        <button className="link-btn" onClick={() => onGoto("sellers")}>
          مشاهده همه
          <IconChevronLeft />
        </button>
      </div>

      <div className="queue-grid">
        {pending.slice(0, 4).map((s) => (
          <div className="card queue-card" key={s.id}>
            <div className="queue-top">
              <div>
                <div className="queue-biz-name">{s.name}</div>
                <span className="queue-cat">{s.category}</span>
              </div>
              <Pill cls={sellerStatusMeta[s.status].cls} label={sellerStatusMeta[s.status].label} />
            </div>
            <div className="queue-meta">
              <div>
                <IconUsers /> {s.owner}
              </div>
              <div>
                <IconPin /> {s.city}
              </div>
              <div>
                <IconCalendar /> {s.submitted}
              </div>
            </div>
            <div className="queue-actions">
              <button className="btn btn-approve" onClick={() => onSellerStatus(s.id, "approved")}>
                <IconCheck /> تأیید
              </button>
              <button className="btn btn-reject" onClick={() => onSellerStatus(s.id, "rejected")}>
                <IconX /> رد
              </button>
            </div>
          </div>
        ))}
        {pending.length === 0 ? (
          <div className="card empty-state" style={{ gridColumn: "1 / -1" }}>
            <div className="e-title">درخواستی در صف نیست</div>
            <div className="e-sub">همه فروشگاه‌ها بررسی شده‌اند</div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ------------ sellers ------------ */

function SellersView({ sellers, categories, onStatus, onBanner }) {
  const [status, setStatus] = useState("all");
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");

  const rows = sellers.filter((s) => {
    const okStatus = status === "all" || s.status === status;
    const okCat = cat === "all" || s.category === cat;
    const okQ = !q.trim() || s.name.includes(q.trim()) || s.owner.includes(q.trim()) || s.city.includes(q.trim());
    return okStatus && okCat && okQ;
  });

  return (
    <section className="view">
      <div className="filters-bar">
        <Dropdown
          minWidth={150}
          value={status}
          onChange={setStatus}
          clearable
          options={[
            { value: "all", label: "همه وضعیت‌ها" },
            { value: "pending", label: "در انتظار", color: "var(--accent)" },
            { value: "approved", label: "فعال", color: "var(--ok)" },
            { value: "suspended", label: "تعلیق‌شده", color: "var(--bad)" },
            { value: "rejected", label: "رد شده", color: "var(--bad)" },
          ]}
        />
        <Dropdown
          minWidth={150}
          value={cat}
          onChange={setCat}
          clearable
          options={[
            { value: "all", label: "همه دسته‌ها" },
            ...categories.map((c) => ({ value: c.name, label: c.name })),
          ]}
        />
        <SearchBox value={q} onChange={setQ} placeholder="جستجوی فروشگاه یا صاحب…" />
        <ResetFilters
          show={status !== "all" || cat !== "all" || q.trim() !== ""}
          onReset={() => {
            setStatus("all");
            setCat("all");
            setQ("");
          }}
        />
        <div className="filter-count">{fa(rows.length)} فروشگاه</div>
      </div>

      <div className="card table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>فروشگاه</th>
                <th>صاحب</th>
                <th>دسته</th>
                <th>شهر</th>
                <th>وضعیت</th>
                <th>بنر</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="biz-cell">
                      <div className="biz-logo" style={{ background: s.color }}>
                        {s.initials}
                      </div>
                      <div>
                        <div className="biz-name">{s.name}</div>
                        <div className="biz-owner">{s.submitted}</div>
                      </div>
                    </div>
                  </td>
                  <td>{s.owner}</td>
                  <td>
                    <span className="cat-tag">{s.category}</span>
                  </td>
                  <td>{s.city}</td>
                  <td>
                    <Pill cls={sellerStatusMeta[s.status].cls} label={sellerStatusMeta[s.status].label} />
                  </td>
                  <td>
                    <Switch on={s.banner} onClick={() => onBanner(s.id)} />
                  </td>
                  <td>
                    <Dropdown
                      className="dd-compact"
                      minWidth={190}
                      value={s.status}
                      onChange={(v) => onStatus(s.id, v)}
                      options={[
                        { value: "pending", label: "در انتظار", color: "var(--accent)" },
                        { value: "approved", label: "فعال", color: "var(--ok)" },
                        { value: "suspended", label: "تعلیق‌شده", color: "var(--bad)" },
                        { value: "rejected", label: "رد شده", color: "var(--bad)" },
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="e-title">فروشگاهی پیدا نشد</div>
                      <div className="e-sub">فیلترها را تغییر بده</div>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ------------ users ------------ */

function UsersView({ users, onStatus }) {
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");

  const rows = users.filter((u) => {
    const okStatus = status === "all" || u.status === status;
    const okQ = !q.trim() || u.name.includes(q.trim()) || u.email.includes(q.trim());
    return okStatus && okQ;
  });

  return (
    <section className="view">
      <div className="filters-bar">
        <Dropdown
          minWidth={150}
          value={status}
          onChange={setStatus}
          clearable
          options={[
            { value: "all", label: "همه وضعیت‌ها" },
            { value: "active", label: "فعال", color: "var(--ok)" },
            { value: "blocked", label: "مسدود", color: "var(--bad)" },
          ]}
        />
        <SearchBox value={q} onChange={setQ} placeholder="جستجوی نام یا ایمیل…" />
        <ResetFilters
          show={status !== "all" || q.trim() !== ""}
          onReset={() => {
            setStatus("all");
            setQ("");
          }}
        />
        <div className="filter-count">{fa(rows.length)} کاربر</div>
      </div>

      <div className="card table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>کاربر</th>
                <th>ایمیل</th>
                <th>نقش</th>
                <th>عضویت</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="biz-cell">
                      <div className="biz-logo" style={{ background: u.color }}>
                        {u.initials}
                      </div>
                      <div className="biz-name">{u.name}</div>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.joined}</td>
                  <td>
                    <Pill
                      cls={u.status === "active" ? "approved" : "rejected"}
                      label={u.status === "active" ? "فعال" : "مسدود"}
                    />
                  </td>
                  <td>
                    <div className="row-actions">
                      {u.status === "active" ? (
                        <button className="no" title="مسدود کردن" onClick={() => onStatus(u.id, "blocked")}>
                          <IconX />
                        </button>
                      ) : (
                        <button className="ok" title="فعال‌سازی" onClick={() => onStatus(u.id, "active")}>
                          <IconCheck />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="e-title">کاربری پیدا نشد</div>
                      <div className="e-sub">فیلترها را تغییر بده</div>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ------------ clicks ------------ */

function RevenueView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.admin.getRevenue();
        if (!cancelled) setData(res?.data || null);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="view">
        <div className="empty-state">
          <div className="e-title">در حال بارگذاری...</div>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="view">
        <div className="empty-state">
          <div className="e-title">خطا در دریافت اطلاعات درآمد</div>
        </div>
      </section>
    );
  }

  const maxTrend = Math.max(
    ...data.monthlyTrend.map((m) => m.subscriptions + m.promos),
    1
  );

  return (
    <section className="view">
      <div className="section-head">
        <div>
          <h3>کسب‌ودرآمد</h3>
          <div className="section-sub">مجموع درآمد از اشتراک‌ها و تبلیغات (تا وصل شدن درگاه پرداخت، بر اساس تراکنش‌های ثبت‌شده)</div>
        </div>
      </div>

      <div className="stat-strip">
        <div className="card mini-stat">
          <div className="l">درآمد ماهانه مستمر (MRR)</div>
          <div className="v">{faNum(data.mrr)} تومان</div>
        </div>
        <div className="card mini-stat">
          <div className="l">درآمد این ماه</div>
          <div className="v">{faNum(data.revenueThisMonth)} تومان</div>
        </div>
        <div className="card mini-stat">
          <div className="l">درآمد کل</div>
          <div className="v">{faNum(data.totalRevenue)} تومان</div>
        </div>
        <div className="card mini-stat">
          <div className="l">اشتراک‌های فعال</div>
          <div className="v">{faNum(data.activeSubscriptionsCount)}</div>
        </div>
      </div>

      <div className="card panel" style={{ marginBottom: 18 }}>
        <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>روند ۶ ماه اخیر</h4>
        <div className="growth-bars">
          {data.monthlyTrend.map((m) => (
            <div className="growth-col" key={m.month}>
              <div
                className="bar"
                style={{ height: `${((m.subscriptions + m.promos) / maxTrend) * 100}%` }}
                title={`${faNum(m.subscriptions + m.promos)} تومان`}
              />
              <div className="bar-label">{m.month}</div>
            </div>
          ))}
        </div>
      </div>

      {Object.keys(data.byPlan).length > 0 && (
        <div className="card panel" style={{ marginBottom: 18 }}>
          <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>تفکیک اشتراک فعال بر اساس پلن</h4>
          <div className="stat-strip">
            {Object.entries(data.byPlan).map(([planName, count]) => (
              <div className="card mini-stat" key={planName}>
                <div className="l">{planName}</div>
                <div className="v">{faNum(count)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card table-card">
        <div className="table-scroll">
          {data.recentTransactions.length === 0 ? (
            <div className="empty-state">
              <div className="e-title">هنوز تراکنشی ثبت نشده است</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>فروشگاه</th>
                  <th>نوع</th>
                  <th>مبلغ</th>
                  <th>وضعیت</th>
                  <th>تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.map((t, i) => (
                  <tr key={i}>
                    <td>
                      <div className="biz-cell">
                        <div className="biz-logo" style={{ background: colorForName(t.business || '') }}>
                          {initialsForName(t.business || '')}
                        </div>
                        <div className="biz-name">{t.business}</div>
                      </div>
                    </td>
                    <td>{t.label}</td>
                    <td>{faNum(t.amount)} تومان</td>
                    <td>
                      <span
                        className="status-pill"
                        style={{
                          background: t.status === 'active' ? 'var(--ok-tint)' : t.status === 'rejected' || t.status === 'failed' ? 'var(--bad-tint)' : 'var(--card)',
                          color: t.status === 'active' ? 'var(--ok)' : t.status === 'rejected' || t.status === 'failed' ? 'var(--bad)' : 'var(--text-muted)',
                        }}
                      >
                        {t.status === 'active' ? 'فعال' : t.status === 'expired' ? 'منقضی' : t.status === 'rejected' ? 'رد شده' : 'در انتظار'}
                      </span>
                    </td>
                    <td>{new Date(t.date).toLocaleDateString('fa-IR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}

function ClicksView() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.admin.getClicks();
        if (!cancelled) setRows(res?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalCalls = rows.reduce((a, x) => a + (x.call_count || 0), 0);
  const totalRoutes = rows.reduce((a, x) => a + (x.route_count || 0), 0);

  return (
    <section className="view">
      <div className="section-head">
        <div>
          <h3>گزارش کلیک‌ها</h3>
          <div className="section-sub">مبنای صورتحساب فروشنده‌ها — مجموع کل بازه فعالیت فروشگاه</div>
        </div>
      </div>

      <div className="stat-strip">
        <div className="card mini-stat">
          <div className="l">کل کلیک تلفن</div>
          <div className="v">{faNum(totalCalls)}</div>
        </div>
        <div className="card mini-stat">
          <div className="l">کل کلیک مسیریابی</div>
          <div className="v">{faNum(totalRoutes)}</div>
        </div>
        <div className="card mini-stat">
          <div className="l">مجموع</div>
          <div className="v">{faNum(totalCalls + totalRoutes)}</div>
        </div>
      </div>

      <div className="card table-card">
        <div className="table-scroll">
          {loading ? (
            <div className="empty-state">
              <div className="e-title">در حال بارگذاری...</div>
            </div>
          ) : rows.length === 0 ? (
            <div className="empty-state">
              <div className="e-title">هنوز کلیکی ثبت نشده است</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>فروشگاه</th>
                  <th>دسته</th>
                  <th>تلفن</th>
                  <th>مسیریابی</th>
                  <th>مجموع</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((x) => (
                  <tr key={x.id}>
                    <td>
                      <div className="biz-cell">
                        <div className="biz-logo" style={{ background: colorForName(x.name) }}>
                          {initialsForName(x.name)}
                        </div>
                        <div className="biz-name">{x.name}</div>
                      </div>
                    </td>
                    <td>
                      <span className="cat-tag">{x.category?.name || "—"}</span>
                    </td>
                    <td>{faNum(x.call_count || 0)}</td>
                    <td>{faNum(x.route_count || 0)}</td>
                    <td>
                      <b>{faNum((x.call_count || 0) + (x.route_count || 0))}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------ promotions ------------ */

function PromotionsView({ promos, onStatus, onVisible }) {
  const [status, setStatus] = useState("all");

  const rows = promos.filter((p) => status === "all" || p.status === status);

  return (
    <section className="view">
      <div className="filters-bar">
        <Dropdown
          minWidth={160}
          value={status}
          onChange={setStatus}
          clearable
          options={[
            { value: "all", label: "همه وضعیت‌ها" },
            { value: "active", label: "فعال", color: "var(--ok)" },
            { value: "pending", label: "در انتظار", color: "var(--accent)" },
            { value: "rejected", label: "رد شده", color: "var(--bad)" },
          ]}
        />
        <div className="filter-count">{fa(rows.length)} درخواست</div>
      </div>

      <div className="promo-grid">
        {rows.map((p) => {
          const info = promoTypeInfo[p.type] || { features: [], featured: false };
          return (
            <div className={"card promo-card" + (info.featured ? " featured" : "")} key={p.id}>
              <div className="promo-badge">
                <Pill
                  cls={p.status === "active" ? "approved" : p.status === "pending" ? "pending" : "rejected"}
                  label={p.status === "active" ? "فعال" : p.status === "pending" ? "در انتظار" : "رد شده"}
                />
              </div>
              <div className="biz-cell" style={{ marginTop: 8 }}>
                <div className="biz-logo" style={{ background: p.color }}>
                  {p.initials}
                </div>
                <div>
                  <div className="biz-name">{p.seller}</div>
                  <div className="biz-owner">{p.type}</div>
                </div>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 600 }}>
                {faNum(p.price)} تومان · {fa(p.days)} روز · {p.date}
              </div>
              <ul className="pkg-features">
                {info.features.map((f) => (
                  <li key={f}>
                    <IconCheck /> {f}
                  </li>
                ))}
              </ul>
              <div className="pkg-actions">
                {p.status === "pending" ? (
                  <>
                    <button className="pkg-cta" onClick={() => onStatus(p.id, "active")}>
                      تأیید
                    </button>
                    <button className="pkg-cta secondary" onClick={() => onStatus(p.id, "rejected")}>
                      رد
                    </button>
                  </>
                ) : p.status === "active" ? (
                  <button className="pkg-cta secondary" onClick={() => onVisible(p.id)}>
                    {p.visible ? "مخفی کردن" : "نمایش"}
                  </button>
                ) : (
                  <button className="pkg-cta" onClick={() => onStatus(p.id, "pending")}>
                    بازگشت به صف
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {rows.length === 0 ? (
          <div className="card empty-state" style={{ gridColumn: "1 / -1" }}>
            <div className="e-title">درخواستی پیدا نشد</div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ------------ categories ------------ */

function CategoriesView({ categories, onAdd, onEdit, onDelete }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📦");
  const [keyName, setKeyName] = useState("other");
  const [editId, setEditId] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const selectedIcon = catIcons[keyName] || defaultIconSvg;

  const submit = () => {
    if (!name.trim()) return;
    if (editId) {
      onEdit(editId, keyName, emoji, name.trim(), null);
      setEditId(null);
    } else {
      onAdd(keyName, emoji, name.trim(), null);
    }
    setName("");
    setEmoji("📦");
    setKeyName("other");
  };

  const selectIcon = (opt) => {
    setKeyName(opt.key);
    setEmoji(opt.emoji);
    setPickerOpen(false);
  };

  return (
    <section className="view">
      <div className="card panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">{editId ? "ویرایش دسته‌بندی" : "افزودن دسته‌بندی جدید"}</div>
            <div className="panel-desc">نام و آیکون دسته‌بندی را انتخاب کنید (آیکون‌ها مثل صفحه اصلی سایت هستند)</div>
          </div>
        </div>

        <div className="cat-form-row">
          {/* دکمه انتخاب آیکون */}
          <button
  type="button"
  className="cat-icon-pick"
  onClick={() => setPickerOpen((v) => !v)}
  title="انتخاب آیکون"
  style={{
    color: ICON_OPTIONS.find((o) => o.key === keyName)?.color || "var(--primary)",
    borderColor: ICON_OPTIONS.find((o) => o.key === keyName)?.color || "var(--border)",
    background: `${ICON_OPTIONS.find((o) => o.key === keyName)?.color || "var(--primary)"}12`,
  }}
>
  <CatIconSvg icon={selectedIcon} size={24} />
</button>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام دسته‌بندی"
            className="cat-name-input"
          />

          <button className="save-btn" style={{ marginTop: 0 }} onClick={submit}>
            {editId ? "ذخیره تغییرات" : "افزودن"}
          </button>

          {editId ? (
            <button
              className="btn btn-ghost"
              onClick={() => {
                setEditId(null);
                setName("");
                setEmoji("📦");
                setKeyName("other");
              }}
            >
              انصراف
            </button>
          ) : null}
        </div>

        {/* پنل انتخاب آیکون */}
        {pickerOpen && (
          <div className="cat-icon-picker">
            <div className="cat-icon-picker-head">
              <span>انتخاب آیکون</span>
              <button type="button" className="btn btn-ghost" style={{ padding: "4px 10px" }} onClick={() => setPickerOpen(false)}>
                بستن
              </button>
            </div>
            <div className="cat-icon-grid">
            {ICON_OPTIONS.map((opt) => (
  <button
    key={opt.key}
    type="button"
    className={"cat-icon-option" + (keyName === opt.key ? " selected" : "")}
    onClick={() => selectIcon(opt)}
    title={opt.label}
    style={{
      "--icon-color": opt.color,
      color: keyName === opt.key ? opt.color : undefined,
    }}
  >
    <div className="cat-icon-option-badge" style={{ background: `${opt.color}18`, color: opt.color }}>
      <CatIconSvg icon={catIcons[opt.key] || defaultIconSvg} size={22} />
    </div>
    <span>{opt.label}</span>
  </button>
))}
            </div>
          </div>
        )}
      </div>

      <div className="queue-grid">
        {categories.map((c) => {
          const iconData = resolveCategoryIcon(c);
          return (
            <div className="card queue-card" key={c.id} style={{ borderInlineStartColor: "var(--primary)" }}>
              <div className="queue-top">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="cat-admin-icon">
                    {iconData.type === "emoji" ? (
                      <span style={{ fontSize: 22 }}>{iconData.value}</span>
                    ) : (
                      <CatIconSvg icon={iconData.value} size={22} />
                    )}
                  </div>
                  <div>
                    <div className="queue-biz-name">{c.name}</div>
                    <div className="biz-owner">
                      {fa(c.count)} فروشگاه
                      {c.key_name ? ` · ${c.key_name}` : ""}
                    </div>
                  </div>
                </div>
              </div>
              <div className="queue-actions">
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setEditId(c.id);
                    setName(c.name);
                    setEmoji(c.emoji || "📦");
                    setKeyName(c.icon || "other");
                    setPickerOpen(false);
                  }}
                >
                  <IconEdit /> ویرایش
                </button>
                <button className="btn btn-reject" onClick={() => onDelete(c.id)}>
                  <IconTrash /> حذف
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}


/* ------------ products ------------ */
const productStatusMeta = {
  active: { label: "فعال", cls: "approved" },
  hidden: { label: "مخفی", cls: "rejected" },
  review: { label: "در انتظار بررسی", cls: "pending" },
};
function ProductsView({ products, sellers, categories, onStatus, onDelete }) {
  const [seller, setSeller] = useState("all");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");

  const rows = products.filter((p) => {
    const okSeller = seller === "all" || p.seller === seller;
    const okCat = cat === "all" || p.category === cat;
    const okStatus = status === "all" || p.status === status;
    const okQ = !q.trim() || p.name.includes(q.trim()) || p.seller.includes(q.trim());
    return okSeller && okCat && okStatus && okQ;
  });

  return (
    <section className="view">
      <div className="filters-bar">
        <Dropdown
          minWidth={160}
          value={seller}
          onChange={setSeller}
          clearable
          options={[
            { value: "all", label: "همه فروشگاه‌ها" },
            ...sellers.map((s) => ({ value: s.name, label: s.name })),
          ]}
        />
        <Dropdown
          minWidth={140}
          value={cat}
          onChange={setCat}
          clearable
          options={[
            { value: "all", label: "همه دسته‌ها" },
            ...categories.map((c) => ({ value: c.name, label: c.name })),
          ]}
        />
        <Dropdown
          minWidth={160}
          value={status}
          onChange={setStatus}
          clearable
          options={[
            { value: "all", label: "همه وضعیت‌ها" },
            { value: "active", label: "فعال", color: "var(--ok)" },
            { value: "hidden", label: "مخفی", color: "var(--bad)" },
            { value: "review", label: "در انتظار بررسی", color: "var(--accent)" },
          ]}
        />
        <SearchBox value={q} onChange={setQ} placeholder="جستجوی محصول یا فروشگاه…" />
        <ResetFilters
          show={seller !== "all" || cat !== "all" || status !== "all" || q.trim() !== ""}
          onReset={() => {
            setSeller("all");
            setCat("all");
            setStatus("all");
            setQ("");
          }}
        />
        <div className="filter-count">{fa(rows.length)} محصول</div>
      </div>

      <div className="card table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>محصول</th>
                <th>فروشگاه</th>
                <th>دسته</th>
                <th>قیمت</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="biz-name">{p.name}</td>
                  <td>{p.seller}</td>
                  <td>
                    <span className="cat-tag">{p.category}</span>
                  </td>
                  <td>{faNum(p.price)} ت</td>
                   <td>
                    <Pill cls={productStatusMeta[p.status].cls} label={productStatusMeta[p.status].label} />
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="no" title="حذف" onClick={() => onDelete(p.id)}>
                        <IconTrash />
                      </button>
                      <Dropdown
                        className="dd-wide"
                        minWidth={190}
                        value={p.status}
                        onChange={(v) => onStatus(p.id, v)}
                        options={[
                          { value: "active", label: "فعال", color: "var(--ok)" },
                          { value: "hidden", label: "مخفی", color: "var(--bad)" },
                          { value: "review", label: "در انتظار بررسی", color: "var(--accent)" },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="e-title">محصولی پیدا نشد</div>
                      <div className="e-sub">فیلترها را تغییر بده</div>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ------------ support ------------ */

function SupportView({ threads, activeId, onSelect, onSend }) {
  const [q, setQ] = useState("");
  const [text, setText] = useState("");
  const [pane, setPane] = useState("list");
  const safeThreads = Array.isArray(threads) ? threads : [];
  const active = safeThreads.find((t) => t.id === activeId) ?? safeThreads[0] ?? null;
  const list = safeThreads.filter(
    (t) =>
      q.trim() === "" ||
      String(t.name || "").includes(q.trim()) ||
      String(t.role || "").includes(q.trim())
  );

  const send = () => {
    if (!active || !text.trim()) return;
    onSend(active.id, text.trim());
    setText("");
  };

  if (!active) {
    return (
      <section className="view">
        <div className="card empty-state">
          <div className="e-title">هنوز پیام پشتیبانی ثبت نشده است</div>
          <div className="e-sub">وقتی کاربری پیام ارسال کند، گفت‌وگوهای پشتیبانی اینجا نمایش داده می‌شوند.</div>
        </div>
      </section>
    );
  }

  return (
    <section className="view">
      <div className={"chat-wrap " + (pane === "chat" ? "mobile-chat" : "mobile-list")}>
        <div className="card thread-list">
          <div className="filter-search" style={{ margin: "4px 4px 8px" }}>
            <IconSearch />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجوی کاربر…" />
          </div>
          {list.map((t) => (
            <button
              key={t.id}
              className={"thread-item" + (t.id === active.id ? " active" : "")}
              onClick={() => {
                onSelect(t.id);
                setPane("chat");
              }}
            >
              <div className="biz-logo" style={{ background: t.color }}>
                {t.initials}
              </div>
              <div>
                <div className="t-name">{t.name}</div>
                <div className="t-prev">{t.messages?.[t.messages.length - 1]?.text || "بدون پیام"}</div>
              </div>
              {t.unread > 0 ? <span className="t-unread">{fa(t.unread)}</span> : null}
            </button>
          ))}
        </div>

        <div className="card chat-panel">
          <div className="chat-head">
            <button className="chat-back" onClick={() => setPane("list")}>
              <IconChevronLeft />
            </button>
            <div className="biz-logo" style={{ background: active.color }}>
              {active.initials}
            </div>
            <div>
              <div className="biz-name">{active.name}</div>
              <div className="biz-owner">{active.role}</div>
            </div>
          </div>
          <div className="chat-body">
            {(active.messages || []).map((m) => (
              <div className={"bubble " + (m.from === "admin" ? "me" : "them")} key={m.id}>
                {m.text}
                <span className="b-time">{m.time}</span>
              </div>
            ))}
          </div>
          <div className="chat-compose">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="پاسخ خود را بنویسید…"
            />
            <button className="send-btn" onClick={send}>
              <IconSend />
              <span>ارسال</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------ settings ------------ */

function SettingsView({ onToast }) {
  const navigate = useNavigate();
  const [toggles, setToggles] = useState({ registration: true, autoApprove: false, maintenance: false });
  const [siteName, setSiteName] = useState("LOKAOO");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.admin.getSettings();
        if (cancelled || !res?.data) return;
        setToggles({
          registration: !!res.data.registration_open,
          autoApprove: !!res.data.auto_approve,
          maintenance: !!res.data.maintenance_mode,
        });
        setSiteName(res.data.site_name || "LOKAOO");
      } catch (err) {
        onToast(err.message || "خطا در دریافت تنظیمات", "no");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.admin.updateSettings({
        site_name: siteName,
        registration_open: toggles.registration,
        auto_approve: toggles.autoApprove,
        maintenance_mode: toggles.maintenance,
      });
      onToast("تنظیمات ذخیره شد", "ok");
    } catch (err) {
      onToast(err.message || "خطا در ذخیره تنظیمات", "no");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeBusinessId");
    navigate("/auth", { replace: true });
  };

  if (loading) {
    return (
      <section className="view">
        <div className="empty-state">
          <div className="e-title">در حال بارگذاری تنظیمات...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="view">
      <div className="settings-grid">
        <div className="card settings-card">
          <h4>بنر صفحه اصلی</h4>
          <div className="desc">تصویر بنری که در صفحه اصلی LOKAOO نمایش داده می‌شود</div>
          <div className="empty-state" style={{ padding: 24, border: "1.5px dashed var(--border)", borderRadius: 12, marginBottom: 14 }}>
            <IconImage />
            <div className="e-sub">آپلود تصویر بنر (به‌زودی)</div>
          </div>
        </div>
        <div className="card settings-card">
          <h4>تنظیمات عمومی</h4>
          <div className="desc">پیکربندی کلی رفتار پلتفرم</div>
          <div className="field-row">
            <label>نام سایت</label>
            <input value={siteName} onChange={(e) => setSiteName(e.target.value)} />
          </div>
          <div className="toggle-row">
            <div>
              <div className="t-label">ثبت‌نام فروشنده جدید</div>
              <div className="t-desc">امکان ارسال درخواست ثبت فروشگاه</div>
            </div>
            <Switch on={toggles.registration} onClick={() => setToggles({ ...toggles, registration: !toggles.registration })} />
          </div>
          <div className="toggle-row">
            <div>
              <div className="t-label">تأیید خودکار فروشگاه‌ها</div>
              <div className="t-desc">بدون بررسی دستی ادمین</div>
            </div>
            <Switch on={toggles.autoApprove} onClick={() => setToggles({ ...toggles, autoApprove: !toggles.autoApprove })} />
          </div>
          <div className="toggle-row">
            <div>
              <div className="t-label">حالت تعمیرات</div>
              <div className="t-desc">نمایش صفحه تعمیرات به کاربران</div>
            </div>
            <Switch on={toggles.maintenance} onClick={() => setToggles({ ...toggles, maintenance: !toggles.maintenance })} />
          </div>
          <button className="save-btn" disabled={saving} onClick={saveSettings}>
            {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </button>
        </div>

        <div className="card settings-card">
          <h4>حساب کاربری</h4>
          <div className="desc">خروج از پنل مدیریت یا بازگشت به سایت اصلی</div>
          <div className="account-actions">
            <button className="account-btn" onClick={() => (window.location.href = "/")}>
              <IconHome />
              بازگشت به صفحه اصلی
            </button>
            <button
              className="account-btn danger"
              onClick={handleLogout}
            >
              <IconLogout />
              خروج
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FooterManagementView({ data, onChange, onToast }) {
  const [newColTitle, setNewColTitle] = useState("");
  const [linkDrafts, setLinkDrafts] = useState({});
  const [saving, setSaving] = useState(false);

  const saveFooter = async () => {
    setSaving(true);
    try {
      await api.admin.updateFooter(data);
      onToast("تغییرات فوتر ذخیره شد", "ok");
    } catch (err) {
      onToast(err.message || "خطا در ذخیره فوتر", "no");
    } finally {
      setSaving(false);
    }
  };

  const updateBrandDesc = (v) => onChange({ ...data, brand: { ...data.brand, description: v } });
  const updateSocial = (key, v) => onChange({ ...data, brand: { ...data.brand, social: { ...data.brand.social, [key]: v } } });
  const updateBottom = (key, v) => onChange({ ...data, [key]: v });

  const addColumn = () => {
    if (!newColTitle.trim()) return;
    onChange({ ...data, columns: [...data.columns, { id: uid(), title: newColTitle.trim(), links: [] }] });
    setNewColTitle("");
    onToast("ستون جدید اضافه شد", "ok");
  };

  const renameColumn = (colId, title) =>
    onChange({ ...data, columns: data.columns.map((c) => (c.id === colId ? { ...c, title } : c)) });

  const deleteColumn = (colId) => {
    onChange({ ...data, columns: data.columns.filter((c) => c.id !== colId) });
    onToast("ستون حذف شد", "no");
  };

  const addLink = (colId) => {
    const draft = linkDrafts[colId];
    if (!draft?.label?.trim()) return;
    onChange({
      ...data,
      columns: data.columns.map((c) =>
        c.id === colId
          ? { ...c, links: [...c.links, { id: uid(), label: draft.label.trim(), content: draft.content?.trim() || "" }] }
          : c
      ),
    });
    setLinkDrafts({ ...linkDrafts, [colId]: { label: "", content: "" } });
    onToast("لینک اضافه شد", "ok");
  };

  const updateLink = (colId, linkId, patch) =>
    onChange({
      ...data,
      columns: data.columns.map((c) =>
        c.id === colId ? { ...c, links: c.links.map((l) => (l.id === linkId ? { ...l, ...patch } : l)) } : c
      ),
    });

  const deleteLink = (colId, linkId) => {
    onChange({
      ...data,
      columns: data.columns.map((c) => (c.id === colId ? { ...c, links: c.links.filter((l) => l.id !== linkId) } : c)),
    });
    onToast("لینک حذف شد", "no");
  };

  return (
    <section className="view">
      <div className="card settings-card">
        <h4>معرفی و شبکه‌های اجتماعی</h4>
        <div className="desc">متنی که در بخش معرفی فوتر نمایش داده می‌شود</div>
        <div className="field-row">
          <label>توضیحات فوتر</label>
          <textarea rows={3} value={data.brand.description} onChange={(e) => updateBrandDesc(e.target.value)} />
        </div>
        <div className="field-row">
          <label>لینک اینستاگرام</label>
          <input value={data.brand.social.instagram} onChange={(e) => updateSocial("instagram", e.target.value)} />
        </div>
        <div className="field-row">
          <label>لینک تلگرام</label>
          <input value={data.brand.social.telegram} onChange={(e) => updateSocial("telegram", e.target.value)} />
        </div>
        <div className="field-row">
          <label>لینک ایکس (X)</label>
          <input value={data.brand.social.x} onChange={(e) => updateSocial("x", e.target.value)} />
        </div>
      </div>

      <div className="card settings-card">
        <h4>متن پایین فوتر</h4>
        <div className="desc">متن کوچکی که زیر فوتر نمایش داده می‌شود</div>
        <div className="field-row">
          <label>متن «ساخته شده با...»</label>
          <input value={data.bottomMade} onChange={(e) => updateBottom("bottomMade", e.target.value)} />
        </div>
      </div>

      <div className="card panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">ستون‌های فوتر</div>
            <div className="panel-desc">هر ستون شامل یک عنوان و چند لینک است</div>
          </div>
        </div>
        <div className="cat-form-row">
          <input className="cat-name-input" placeholder="عنوان ستون جدید" value={newColTitle} onChange={(e) => setNewColTitle(e.target.value)} />
          <button className="save-btn" style={{ marginTop: 0 }} onClick={addColumn}>
            <IconPlus /> افزودن ستون
          </button>
        </div>
      </div>

      <div className="footer-admin-grid">
        {data.columns.map((col) => (
          <div className="card footer-col-card" key={col.id}>
            <div className="footer-col-card-head">
              <input className="cat-name-input" value={col.title} onChange={(e) => renameColumn(col.id, e.target.value)} />
              <button className="btn btn-reject" onClick={() => deleteColumn(col.id)} title="حذف ستون">
                <IconTrash />
              </button>
            </div>

            <div className="footer-link-list">
              {col.links.map((l) => (
                <div className="footer-link-row" key={l.id}>
                  <div className="footer-link-inputs">
                    <input className="cat-name-input" value={l.label} placeholder="عنوان لینک"
                      onChange={(e) => updateLink(col.id, l.id, { label: e.target.value })} />
                    <textarea rows={2} value={l.content} placeholder="متن پاپ‌آپ"
                      onChange={(e) => updateLink(col.id, l.id, { content: e.target.value })} />
                  </div>
                  <button className="footer-link-del" onClick={() => deleteLink(col.id, l.id)} title="حذف لینک">
                    <IconTrash />
                  </button>
                </div>
              ))}
              {col.links.length === 0 ? <div className="footer-link-empty">لینکی ثبت نشده</div> : null}
            </div>

            <div className="footer-add-link-row">
              <input className="cat-name-input" placeholder="عنوان لینک جدید"
                value={linkDrafts[col.id]?.label || ""}
                onChange={(e) => setLinkDrafts({ ...linkDrafts, [col.id]: { ...linkDrafts[col.id], label: e.target.value } })} />
              <button className="btn btn-ghost" onClick={() => addLink(col.id)}>
                <IconPlus /> افزودن لینک
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="save-btn" disabled={saving} onClick={saveFooter}>
        {saving ? "در حال ذخیره..." : "ذخیره همه تغییرات"}
      </button>
    </section>
  );
}

/* ===== AdminDashboard.jsx (main component) ===== */

const titles = {
  dashboard: ["داشبورد", "خلاصه‌ای از عملکرد امروز LOKAOO"],
  sellers: ["فروشنده‌ها", "بررسی درخواست‌ها و مدیریت کامل فروشگاه‌ها"],
  users: ["کاربران", "همه افرادی که در پلتفرم حساب کاربری دارند"],
  clicks: ["گزارش کلیک‌ها", "مبنای صورتحساب فروشنده‌ها بر اساس کلیک‌های ثبت‌شده"],
  promotions: ["رشد و تبلیغات", "مدیریت درخواست‌ها و نمایش ویژه فروشگاه‌ها"],
  revenue: ["کسب‌ودرآمد", "آمار درآمد از اشتراک‌ها و تبلیغات"],
  categories: ["دسته‌بندی‌ها", "ساختار دسته‌بندی‌های سایت"],
  products: ["محصولات", "نظارت بر محصولات ثبت‌شده توسط فروشنده‌ها"],
  support: ["پیام‌ها و پشتیبانی", "ارتباط با کاربران و فروشنده‌ها"],
  settings: ["تنظیمات سایت", "پیکربندی کلی پنل مدیریت"],
  footer: ["مدیریت فوتر", "ویرایش محتوای فوتر سایت"],
};


function AdminDashboard() {
  const { theme, toggleTheme, isDark } = useTheme();
  const [view, setView] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [globalQ, setGlobalQ] = useState("");
  const [toast, setToast] = useState(null);
  const [viewHistory, setViewHistory] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sellers, setSellers] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [promos, setPromos] = useState([]);
  const [threads, setThreads] = useState([]);
  const [footerData, setFooterData] = useState(initialFooterData);
  const [stats, setStats] = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const searchWrapRef = useRef(null);

  // ===== بارگذاری داده‌های واقعی از بک‌اند =====
  const loadAdminData = async () => {
    setAdminLoading(true);
    try {
      const [statsRes, businessesRes, usersRes, categoriesRes, productsRes, promosRes, threadsRes, footerRes] =
        await Promise.all([
          api.admin.getStats().catch(() => ({ data: null })),
          api.admin.getBusinesses().catch(() => ({ data: [] })),
          api.admin.getUsers().catch(() => ({ data: [] })),
          api.business.getCategories().catch(() => ({ data: [] })),
          api.admin.getProducts().catch(() => ({ data: [] })),
          api.admin.getPromos().catch(() => ({ data: [] })),
          api.admin.getThreads().catch(() => ({ data: [] })),
          api.admin.getFooter().catch(() => null),
        ]);

      setStats(statsRes?.data || null);
      setSellers((businessesRes?.data || []).map(mapBusinessToSeller));
      setUsers((usersRes?.data || []).map(mapUserToRow));
      setCategories((categoriesRes?.data || []).map(mapCategoryRow));
      setProducts((productsRes?.data || []).map(mapProductRow));
      setPromos((promosRes?.data || []).map(mapPromoRow));

      const mappedThreads = (threadsRes?.data || []).map(mapThreadRow);
      setThreads(mappedThreads);
      setActiveThread((prev) => prev || mappedThreads[0]?.id || null);

      if (footerRes?.data) setFooterData(footerRes.data);
    } catch (err) {
      console.error("خطا در دریافت اطلاعات پنل ادمین:", err);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // دریافت خودکار پیام‌های جدید پشتیبانی بدون نیاز به Refresh
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.admin.getThreads();
        const mappedThreads = (res?.data || []).map(mapThreadRow);
        setThreads(mappedThreads);
        setActiveThread((prev) => prev || mappedThreads[0]?.id || null);
      } catch (err) {
        console.error("خطا در به‌روزرسانی پیام‌های پشتیبانی:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  // بستن سرچ با کلیک بیرون از آن
useEffect(() => {
  if (!searchOpen) return;

  const handleClickOutside = (e) => {
    if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
      setSearchOpen(false);
    }
  };

  // کمی تأخیر تا کلیک روی خود سرچ یا دکمه بک درست کار کند
  const timer = setTimeout(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
  }, 10);

  return () => {
    clearTimeout(timer);
    document.removeEventListener("mousedown", handleClickOutside);
    document.removeEventListener("touchstart", handleClickOutside);
  };
}, [searchOpen]);

  const showToast = (msg, kind = "ok") => setToast({ msg, kind });

  const goto = (v) => {
  setViewHistory((prev) => (v === view ? prev : [...prev, view]));
  setView(v);
  setMenuOpen(false);
};

const goBack = () => {
  setViewHistory((prev) => {
    if (prev.length === 0) {
      window.history.back();
      return prev;
    }
    const next = [...prev];
    setView(next.pop());
    return next;
  });
  setMenuOpen(false);
};
  const pendingSellers = sellers.filter((s) => s.status === "pending").length;
  const pendingPromos = promos.filter((p) => p.status === "pending").length;
  const unread = threads.reduce((a, t) => a + t.unread, 0);

  const navGroups = [
    { label: "نمای کلی", items: [{ key: "dashboard", icon: <IconDashboard /> }] },
    {
      label: "مدیریت",
      items: [
        { key: "sellers", icon: <IconStore />, badge: pendingSellers },
        { key: "users", icon: <IconUsers /> },
        { key: "clicks", icon: <IconClick /> },
        { key: "promotions", icon: <IconMegaphone />, badge: pendingPromos },
        { key: "revenue", icon: <IconWallet /> },
        { key: "categories", icon: <IconGrid /> },
        { key: "products", icon: <IconBox /> },
        { key: "support", icon: <IconChat />, badge: unread },
      ],
    },
    { label: "پیکربندی", items: [
  { key: "settings", icon: <IconSettings /> },
  { key: "footer", icon: <IconFooterMenu /> },
] },
  ];

  const setSellerStatus = async (id, status) => {
    const prevSellers = sellers;
    setSellers((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    try {
      await api.admin.updateBusinessStatus(id, status);
      showToast(
        status === "approved" ? "فروشگاه تأیید شد" : status === "rejected" ? "درخواست رد شد" : "وضعیت فروشگاه تغییر کرد",
        status === "approved" ? "ok" : "no",
      );
    } catch (err) {
      setSellers(prevSellers);
      showToast(err.message || "خطا در تغییر وضعیت فروشگاه", "no");
    }
  };

  const toggleSellerBanner = async (id) => {
    const prevSellers = sellers;
    setSellers((prev) => prev.map((s) => (s.id === id ? { ...s, banner: !s.banner } : s)));
    try {
      await api.admin.toggleBusinessBanner(id);
      showToast("دسترسی بنر تغییر کرد", "ok");
    } catch (err) {
      setSellers(prevSellers);
      showToast(err.message || "خطا در تغییر دسترسی بنر", "no");
    }
  };

  return (
    <div className="lk">
      <div className="app-shell">
        <aside className={"sidebar" + (menuOpen ? " open" : "")}>
        <div className="logo">
            <img
              src={isDark ? logoWhite : logoBlack}
              alt="لوکاوو"
              className="logo-img"
            />
            <div className="logo-sub">پنل مدیریت ادمین</div>
          </div>

          {navGroups.map((g) => (
            <div key={g.label}>
              <div className="nav-label">{g.label}</div>
              <div className="nav">
                {g.items.map((it) => (
                  <a key={it.key} className={view === it.key ? "active" : ""} onClick={() => goto(it.key)}>
                    {it.icon}
                    {titles[it.key][0]}
                    {it.badge ? <span className="nav-badge">{fa(it.badge)}</span> : null}
                  </a>
                ))}
              </div>
            </div>
          ))}

          <div className="sidebar-footer">
            <button
              type="button"
              className="sidebar-home-btn"
              onClick={() => (window.location.href = "/")}
            >
              <IconHome />
              بازگشت به صفحه اصلی
            </button>

            <div className="admin-row">
              <div className="admin-avatar">ا.ک</div>
              <div>
                <div className="admin-name">ادمین کل</div>
                <div className="admin-role">دسترسی کامل</div>
              </div>
            </div>
          </div>
        </aside>

        <div className={"scrim" + (menuOpen ? " show" : "")} onClick={() => setMenuOpen(false)} />

        <div className="main">
        <div className={"topbar" + (searchOpen ? " search-open" : "")}>
  {/* وقتی سرچ باز نیست */}
  {!searchOpen && (
    <>
      <button className="menu-toggle" onClick={() => setMenuOpen((v) => !v)} aria-label="منو">
        <IconMenu />
      </button>

      <img
        src={isDark ? logoWhite : logoBlack}
        alt="لوکاوو"
        className="topbar-mobile-logo"
      />

      <button
        className="back-btn"
        onClick={goBack}
        title="بازگشت"
        aria-label="بازگشت"
      >
        <IconChevronLeft />
      </button>

      <div className="page-heading">
        <h1>{titles[view][0]}</h1>
        <p>{titles[view][1]}</p>
      </div>
    </>
  )}

  {/* وقتی سرچ باز است فقط لوگو + بک */}
  {searchOpen && (
    <>
      <img
        src={isDark ? logoWhite : logoBlack}
        alt="لوکاوو"
        className="topbar-mobile-logo"
        style={{ display: "block" }}
      />
      <button
        className="back-btn"
        onClick={() => {
          setSearchOpen(false);
          setGlobalQ("");
        }}
        title="بستن جستجو"
        aria-label="بستن جستجو"
      >
        <IconChevronLeft />
      </button>
    </>
  )}

<div className="search-wrap" ref={searchWrapRef}>
  <IconSearch />
  <input
    value={globalQ}
    onChange={(e) => setGlobalQ(e.target.value)}
    onFocus={() => setSearchOpen(true)}
    onBlur={() => {
      // اگر کاربر فقط از اینپوت خارج شد و جای دیگری کلیک نکرد، بعد از کمی تأخیر ببند
      setTimeout(() => {
        if (!searchWrapRef.current?.contains(document.activeElement)) {
          setSearchOpen(false);
        }
      }, 150);
    }}
    placeholder="جستجو در فروشگاه‌ها، کاربران، محصولات…"
  />
</div>

  {/* آیکون‌های سمت چپ فقط وقتی سرچ باز نیست */}
  {!searchOpen && (
    <div className="topbar-actions">
      <button
        className="icon-btn"
        onClick={toggleTheme}
        title="تغییر تم"
      >
        {isDark ? <IconMoon /> : <IconSun />}
      </button>

      <button
        className="icon-btn"
        onClick={() => goto("support")}
        title="پیام‌ها و پشتیبانی"
      >
        {unread > 0 && <span className="dot" />}
        <IconBell />
      </button>
    </div>
  )}
</div>

          <div className="content">
            {globalQ.trim() ? (
              <GlobalResults q={globalQ.trim()} sellers={sellers} users={users} products={products} onGoto={goto} />
            ) : null}

            {view === "dashboard" && (
              <DashboardView sellers={sellers} stats={stats} onGoto={goto} onSellerStatus={setSellerStatus} />
            )}

            {view === "sellers" && (
              <SellersView
                sellers={sellers}
                categories={categories}
                onStatus={setSellerStatus}
                onBanner={toggleSellerBanner}
              />
            )}

            {view === "users" && (
              <UsersView
                users={users}
                onStatus={async (id, status) => {
                  const prevUsers = users;
                  setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
                  try {
                    await api.admin.updateUserStatus(id, status);
                    showToast(status === "blocked" ? "کاربر مسدود شد" : "کاربر فعال شد", status === "blocked" ? "no" : "ok");
                  } catch (err) {
                    setUsers(prevUsers);
                    showToast(err.message || "خطا در تغییر وضعیت کاربر", "no");
                  }
                }}
              />
            )}

            {view === "clicks" && <ClicksView />}

            {view === "revenue" && <RevenueView />}

            {view === "promotions" && (
              <PromotionsView
                promos={promos}
                onStatus={async (id, status) => {
                  const prevPromos = promos;
                  setPromos((prev) => prev.map((p) => (p.id === id ? { ...p, status, visible: status === "active" } : p)));
                  try {
                    await api.admin.updatePromoStatus(id, status);
                    showToast(status === "active" ? "تبلیغ تأیید شد" : status === "rejected" ? "تبلیغ رد شد" : "به صف بازگشت", status === "rejected" ? "no" : "ok");
                  } catch (err) {
                    setPromos(prevPromos);
                    showToast(err.message || "خطا در تغییر وضعیت تبلیغ", "no");
                  }
                }}
                onVisible={async (id) => {
                  const prevPromos = promos;
                  setPromos((prev) => prev.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p)));
                  try {
                    await api.admin.togglePromoVisible(id);
                  } catch (err) {
                    setPromos(prevPromos);
                    showToast(err.message || "خطا در تغییر نمایش تبلیغ", "no");
                  }
                }}
              />
            )}

{view === "categories" && (
  <CategoriesView
    categories={categories}
    onAdd={async (icon, emoji, name, key_name) => {
      try {
        const color_1 = ICON_OPTIONS.find((o) => o.key === icon)?.color || "#94A3B8";
        const res = await api.admin.createCategory({ name, icon, color_1 });
        setCategories((prev) => [...prev, mapCategoryRow(res.data)]);
        showToast("دسته‌بندی اضافه شد", "ok");
      } catch (err) {
        showToast(err.message || "خطا در افزودن دسته‌بندی", "no");
      }
    }}
    onEdit={async (id, icon, emoji, name, key_name) => {
      const prevCategories = categories;
      const color_1 = ICON_OPTIONS.find((o) => o.key === icon)?.color || "#94A3B8";
      setCategories((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, icon, emoji, name, color: color_1 } : c
        )
      );
      try {
        await api.admin.updateCategory(id, { name, icon, color_1 });
        showToast("دسته‌بندی ویرایش شد", "ok");
      } catch (err) {
        setCategories(prevCategories);
        showToast(err.message || "خطا در ویرایش دسته‌بندی", "no");
      }
    }}
    onDelete={async (id) => {
      const prevCategories = categories;
      setCategories((prev) => prev.filter((c) => c.id !== id));
      try {
        await api.admin.deleteCategory(id);
        showToast("دسته‌بندی حذف شد", "no");
      } catch (err) {
        setCategories(prevCategories);
        showToast(err.message || "خطا در حذف دسته‌بندی (احتمالاً در حال استفاده است)", "no");
      }
    }}
  />
)}

            {view === "products" && (
              <ProductsView
                products={products}
                sellers={sellers}
                categories={categories}
                onStatus={async (id, status) => {
                  const prevProducts = products;
                  setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
                  try {
                    await api.admin.updateProductActive(id, status === "active");
                    showToast("وضعیت محصول تغییر کرد", status === "hidden" ? "no" : "ok");
                  } catch (err) {
                    setProducts(prevProducts);
                    showToast(err.message || "خطا در تغییر وضعیت محصول", "no");
                  }
                }}
                onDelete={async (id) => {
                  const prevProducts = products;
                  setProducts((prev) => prev.filter((p) => p.id !== id));
                  try {
                    await api.admin.deleteProduct(id);
                    showToast("محصول حذف شد", "no");
                  } catch (err) {
                    setProducts(prevProducts);
                    showToast(err.message || "خطا در حذف محصول", "no");
                  }
                }}
              />
            )}

            {view === "support" && (
              <SupportView
                threads={threads}
                activeId={activeThread}
                onSelect={(id) => {
                  setActiveThread(id);
                  setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, unread: 0 } : t)));
                  api.admin.markThreadRead(id).catch(() => {});
                }}
                onSend={async (id, text) => {
                  const time = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
                  const prevThreads = threads;
                  setThreads((prev) =>
                    prev.map((t) =>
                      t.id === id
                        ? { ...t, unread: 0, messages: [...t.messages, { id: uid(), from: "admin", text, time }] }
                        : t,
                    ),
                  );
                  try {
                    await api.admin.sendThreadMessage(id, text);
                    showToast("پیام ارسال شد", "ok");
                  } catch (err) {
                    setThreads(prevThreads);
                    showToast(err.message || "خطا در ارسال پیام", "no");
                  }
                }}
              />
            )}

            {view === "settings" && <SettingsView onToast={showToast} />}
            {view === "footer" && (
  <FooterManagementView data={footerData} onChange={setFooterData} onToast={showToast} />
)}
          </div>
        </div>
      </div>
    </div>
  );
}

function GlobalResults({ q, sellers, users, products, onGoto }) {
  const s = sellers.filter((x) => x.name.includes(q) || x.owner.includes(q));
  const u = users.filter((x) => x.name.includes(q) || x.email.includes(q));
  const p = products.filter((x) => x.name.includes(q));
  const total = s.length + u.length + p.length;

  return (
    <div className="card panel">
      <div className="panel-head">
        <div>
          <div className="panel-title">نتایج جستجو برای «{q}»</div>
          <div className="panel-desc">{fa(total)} نتیجه پیدا شد</div>
        </div>
      </div>
      {total === 0 ? (
        <div className="empty-state">
          <div className="e-title">نتیجه‌ای پیدا نشد</div>
        </div>
      ) : (
        <div className="traffic-list">
          {s.map((x) => (
            <button key={x.id} className="thread-item" onClick={() => onGoto("sellers")}>
              <div className="biz-logo" style={{ background: x.color }}>
                {x.initials}
              </div>
              <div>
                <div className="t-name">{x.name}</div>
                <div className="t-prev">فروشنده · {x.category}</div>
              </div>
            </button>
          ))}
          {u.map((x) => (
            <button key={x.id} className="thread-item" onClick={() => onGoto("users")}>
              <div className="biz-logo" style={{ background: x.color }}>
                {x.initials}
              </div>
              <div>
                <div className="t-name">{x.name}</div>
                <div className="t-prev">کاربر · {x.email}</div>
              </div>
            </button>
          ))}
          {p.map((x) => (
            <button key={x.id} className="thread-item" onClick={() => onGoto("products")}>
              <div className="biz-logo" style={{ background: "var(--primary)" }}>
                م
              </div>
              <div>
                <div className="t-name">{x.name}</div>
                <div className="t-prev">محصول · {x.seller}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;