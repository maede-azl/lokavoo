import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import "./AdminDashboard.css";
import logoBlack from "../assets/locavo-logo-black.png";
import logoWhite from "../assets/locavo-logo-white.png";

function uid() {
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
}

/* ===== admin-data.js ===== */
const fa = (n) =>
  String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)] ?? d);

const faNum = (n) => fa(n.toLocaleString("en-US"));

const initialSellers = [
  { id: "s1", name: "کافه آرامش", owner: "حسین کریمی", category: "کافه", city: "تهران", color: "#2547E8", initials: "کآ", status: "pending", banner: false, submitted: "۲ ساعت پیش" },
  { id: "s2", name: "بوتیک دیبا", owner: "مریم صادقی", category: "پوشاک", city: "اصفهان", color: "#BE185D", initials: "بد", status: "active", banner: true, submitted: "دیروز" },
  { id: "s3", name: "خشکبار طلایی", owner: "رضا نوری", category: "خشکبار", city: "مشهد", color: "#FF9736", initials: "خط", status: "active", banner: false, submitted: "۳ روز پیش" },
  { id: "s4", name: "آتلیه رزا", owner: "رزا محمدی", category: "آتلیه", city: "شیراز", color: "#0D9488", initials: "آر", status: "pending", banner: false, submitted: "دیروز" },
  { id: "s5", name: "رستوران سنتی وحید", owner: "وحید امینی", category: "رستوران", city: "تبریز", color: "#7C3AED", initials: "رو", status: "suspended", banner: false, submitted: "هفته پیش" },
  { id: "s6", name: "قنادی شیرین", owner: "الهام یاری", category: "قنادی", city: "کرج", color: "#DC2626", initials: "قش", status: "pending", banner: false, submitted: "۵ ساعت پیش" },
];

const initialUsers = [
  { id: "u1", name: "سارا محمدی", email: "sara.m@mail.com", joined: "۱۴۰۴/۰۲/۱۱", role: "کاربر عادی", color: "#5271FF", initials: "سم", status: "active" },
  { id: "u2", name: "امیر رضایی", email: "amir.r@mail.com", joined: "۱۴۰۴/۰۱/۳۰", role: "صاحب فروشگاه", color: "#0D9488", initials: "ار", status: "active" },
  { id: "u3", name: "نگار احمدی", email: "negar.a@mail.com", joined: "۱۴۰۳/۱۲/۱۸", role: "کاربر عادی", color: "#DC2626", initials: "نا", status: "blocked" },
  { id: "u4", name: "مریم صادقی", email: "maryam.s@mail.com", joined: "۱۴۰۳/۱۱/۰۵", role: "صاحب فروشگاه", color: "#BE185D", initials: "مص", status: "active" },
  { id: "u5", name: "حسین کریمی", email: "hossein.k@mail.com", joined: "۱۴۰۴/۰۲/۰۲", role: "صاحب فروشگاه", color: "#FF9736", initials: "حک", status: "active" },
];

const clickData = {
  today: [
    { id: "s2", name: "بوتیک دیبا", color: "#BE185D", initials: "بد", category: "پوشاک", phone: 91, location: 33, site: 120 },
    { id: "s1", name: "کافه آرامش", color: "#2547E8", initials: "کآ", category: "کافه", phone: 42, location: 18, site: 65 },
    { id: "s3", name: "خشکبار طلایی", color: "#FF9736", initials: "خط", category: "خشکبار", phone: 27, location: 12, site: 20 },
  ],
  week: [
    { id: "s2", name: "بوتیک دیبا", color: "#BE185D", initials: "بد", category: "پوشاک", phone: 512, location: 233, site: 806 },
    { id: "s1", name: "کافه آرامش", color: "#2547E8", initials: "کآ", category: "کافه", phone: 388, location: 145, site: 470 },
    { id: "s3", name: "خشکبار طلایی", color: "#FF9736", initials: "خط", category: "خشکبار", phone: 190, location: 88, site: 156 },
  ],
  month: [
    { id: "s2", name: "بوتیک دیبا", color: "#BE185D", initials: "بد", category: "پوشاک", phone: 2140, location: 940, site: 3320 },
    { id: "s1", name: "کافه آرامش", color: "#2547E8", initials: "کآ", category: "کافه", phone: 1580, location: 610, site: 1970 },
    { id: "s3", name: "خشکبار طلایی", color: "#FF9736", initials: "خط", category: "خشکبار", phone: 820, location: 355, site: 690 },
  ],
};

const rangeLabels = {
  today: "امروز",
  week: "این هفته",
  month: "این ماه",
};

const initialCategories = [
  { id: "c1", key_name: "cafe", icon: null, emoji: "☕", name: "کافه", count: 48 },
  { id: "c2", key_name: "clothing", icon: null, emoji: "👗", name: "پوشاک", count: 63 },
  { id: "c3", key_name: "dry-fruit", icon: null, emoji: "🌰", name: "خشکبار", count: 21 },
  { id: "c4", key_name: "atelier", icon: null, emoji: "🎨", name: "آتلیه", count: 14 },
  { id: "c5", key_name: "restaurant", icon: null, emoji: "🍽️", name: "رستوران", count: 37 },
  { id: "c6", key_name: "confectionery", icon: null, emoji: "🧁", name: "قنادی", count: 19 },
];

/* ===== Category Icons (same as LokaooCategories) ===== */
const catIcons = {
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

const catIconsByName = {
  "رستوران و کافه": catIcons["restaurant-cafe"],
  "هتل و اقامتگاه": catIcons["hotel"],
  "پزشک، درمانگاه و بیمارستان": catIcons["medical"],
  "داروخانه": catIcons["pharmacy"],
  "آرایشگاه و سالن زیبایی": catIcons["beauty"],
  "مراکز ماساژ و اسپا": catIcons["spa"],
  "باشگاه ورزشی": catIcons["gym"],
  "آموزشگاه و کلاس آموزشی": catIcons["education"],
  "سوپرمارکت و فروشگاه مواد غذایی": catIcons["supermarket"],
  "پوشاک و کیف و کفش": catIcons["clothing"],
  "طلا، جواهر و اکسسوری": catIcons["jewelry"],
  "موبایل و لوازم دیجیتال": catIcons["mobile"],
  "خدمات کامپیوتر و فناوری": catIcons["computer"],
  "نمایشگاه خودرو": catIcons["car-showroom"],
  "تعمیرگاه خودرو": catIcons["car-repair"],
  "خدمات خودرو (کارواش، تعویض روغن و...)": catIcons["car-services"],
  "بانک و خدمات مالی": catIcons["bank"],
  "املاک": catIcons["real-estate"],
  "وکیل و مشاور حقوقی": catIcons["lawyer"],
  "عکاسی و آتلیه": catIcons["photography"],
  "تالار و تشریفات": catIcons["event-hall"],
  "گل‌فروشی": catIcons["florist"],
  "کادو و صنایع دستی": catIcons["gift-handicraft"],
  "خدمات حیوانات خانگی": catIcons["pet-services"],
  "خدمات فنی و تعمیرات": catIcons["technical-services"],
  "خدمات نظافت": catIcons["cleaning"],
  "حمل‌ونقل و باربری": catIcons["transport"],
  "آژانس مسافرتی": catIcons["travel-agency"],
  "اماکن مذهبی": catIcons["religious"],
  "مراکز فرهنگی و هنری": catIcons["cultural"],
  "سینما و تفریح": catIcons["cinema"],
  "جاذبه‌های گردشگری": catIcons["tourism"],
  "خدمات چاپ و تبلیغات": catIcons["print-ads"],
  "تولیدی و کارخانه": catIcons["factory"],
  "نانوایی و قنادی": catIcons["Bakery"],
  "میوه فروشی": catIcons["fruit"],
  "سایر": catIcons["other"],
  // نام‌های فعلی ادمین
  "کافه": catIcons["cafe"],
  "پوشاک": catIcons["clothing"],
  "خشکبار": catIcons["dry-fruit"],
  "آتلیه": catIcons["atelier"],
  "رستوران": catIcons["restaurant"],
  "قنادی": catIcons["confectionery"],
};

const defaultIconSvg = `<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>`;

const ICON_OPTIONS = [
  { key: "cafe", label: "کافه", emoji: "☕", color: "#2547E8" },
  { key: "restaurant", label: "رستوران", emoji: "🍽️", color: "#EF4444" },
  { key: "restaurant-cafe", label: "رستوران و کافه", emoji: "☕", color: "#F97316" },
  { key: "clothing", label: "پوشاک", emoji: "👗", color: "#BE185D" },
  { key: "dry-fruit", label: "خشکبار", emoji: "🌰", color: "#D97706" },
  { key: "atelier", label: "آتلیه", emoji: "🎨", color: "#0D9488" },
  { key: "confectionery", label: "قنادی", emoji: "🧁", color: "#EC4899" },
  { key: "Bakery", label: "نانوایی و قنادی", emoji: "🍞", color: "#F59E0B" },
  { key: "hotel", label: "هتل", emoji: "🏨", color: "#6366F1" },
  { key: "medical", label: "پزشکی", emoji: "🏥", color: "#16A34A" },
  { key: "pharmacy", label: "داروخانه", emoji: "💊", color: "#0EA5E9" },
  { key: "beauty", label: "زیبایی", emoji: "💇", color: "#DB2777" },
  { key: "spa", label: "اسپا", emoji: "💆", color: "#14B8A6" },
  { key: "gym", label: "باشگاه", emoji: "🏋️", color: "#64748B" },
  { key: "education", label: "آموزش", emoji: "🎓", color: "#7C3AED" },
  { key: "supermarket", label: "سوپرمارکت", emoji: "🛒", color: "#059669" },
  { key: "jewelry", label: "طلا و جواهر", emoji: "💎", color: "#A855F7" },
  { key: "mobile", label: "موبایل", emoji: "📱", color: "#3B82F6" },
  { key: "computer", label: "کامپیوتر", emoji: "💻", color: "#4F46E5" },
  { key: "car-showroom", label: "نمایشگاه خودرو", emoji: "🚗", color: "#0891B2" },
  { key: "car-repair", label: "تعمیرگاه", emoji: "🔧", color: "#78716C" },
  { key: "car-services", label: "خدمات خودرو", emoji: "🛢️", color: "#CA8A04" },
  { key: "bank", label: "بانک", emoji: "🏦", color: "#1D4ED8" },
  { key: "real-estate", label: "املاک", emoji: "🏠", color: "#16A34A" },
  { key: "lawyer", label: "حقوقی", emoji: "⚖️", color: "#475569" },
  { key: "photography", label: "عکاسی", emoji: "📷", color: "#E11D48" },
  { key: "event-hall", label: "تالار", emoji: "🎉", color: "#D946EF" },
  { key: "florist", label: "گل‌فروشی", emoji: "🌸", color: "#F43F5E" },
  { key: "gift-handicraft", label: "کادو", emoji: "🎁", color: "#F97316" },
  { key: "pet-services", label: "حیوانات", emoji: "🐾", color: "#A16207" },
  { key: "technical-services", label: "فنی", emoji: "🛠️", color: "#57534E" },
  { key: "cleaning", label: "نظافت", emoji: "🧹", color: "#06B6D4" },
  { key: "transport", label: "حمل‌ونقل", emoji: "🚚", color: "#2563EB" },
  { key: "travel-agency", label: "مسافرتی", emoji: "✈️", color: "#0EA5E9" },
  { key: "religious", label: "مذهبی", emoji: "🕌", color: "#059669" },
  { key: "cultural", label: "فرهنگی", emoji: "🎭", color: "#8B5CF6" },
  { key: "cinema", label: "سینما", emoji: "🎬", color: "#DC2626" },
  { key: "tourism", label: "گردشگری", emoji: "🗺️", color: "#10B981" },
  { key: "print-ads", label: "چاپ", emoji: "🖨️", color: "#64748B" },
  { key: "factory", label: "کارخانه", emoji: "🏭", color: "#78716C" },
  { key: "fruit", label: "میوه", emoji: "🍎", color: "#EF4444" },
  { key: "other", label: "سایر", emoji: "📦", color: "#94A3B8" },
];

function resolveCategoryIcon(cat) {
  const svg =
    (cat.key_name && catIcons[cat.key_name]) ||
    (cat.name && catIconsByName[cat.name]) ||
    null;

  if (svg) return { type: "svg", value: svg };
  if (cat.emoji && String(cat.emoji).trim()) return { type: "emoji", value: cat.emoji };
  return { type: "svg", value: defaultIconSvg };
}

function CatIconSvg({ icon, size = 22 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      dangerouslySetInnerHTML={{ __html: icon }}
    />
  );
}


const initialProducts = [
  { id: "p1", name: "دانه قهوه کلمبیا", seller: "کافه آرامش", category: "کافه", price: 480000, status: "active" },
  { id: "p2", name: "مانتو بهاره", seller: "بوتیک دیبا", category: "پوشاک", price: 1250000, status: "active" },
  { id: "p3", name: "پسته اکبری", seller: "خشکبار طلایی", category: "خشکبار", price: 990000, status: "hidden" },
  { id: "p4", name: "کیک شکلاتی", seller: "قنادی شیرین", category: "قنادی", price: 320000, status: "review" },
  { id: "p5", name: "شال نخی", seller: "بوتیک دیبا", category: "پوشاک", price: 290000, status: "active" },
];

const initialPromos = [
  { id: "pr1", seller: "کافه آرامش", type: "نمایش در صفحه اصلی", price: 300000, days: 14, status: "active", visible: true, color: "#2547E8", initials: "کآ", date: "۱۴۰۴/۰۵/۰۱" },
  { id: "pr2", seller: "بوتیک دیبا", type: "بنر ویژه دسته‌بندی", price: 450000, days: 30, status: "pending", visible: false, color: "#BE185D", initials: "بد", date: "۱۴۰۴/۰۵/۲۹" },
  { id: "pr3", seller: "خشکبار طلایی", type: "نشان فروشگاه برتر", price: 180000, days: 7, status: "pending", visible: false, color: "#FF9736", initials: "خط", date: "۱۴۰۴/۰۵/۲۷" },
  { id: "pr4", seller: "آتلیه رزا", type: "نمایش در صفحه اصلی", price: 300000, days: 14, status: "pending", visible: false, color: "#0D9488", initials: "آر", date: "۱۴۰۴/۰۵/۲۵" },
  { id: "pr5", seller: "رستوران سنتی وحید", type: "بنر ویژه دسته‌بندی", price: 450000, days: 30, status: "rejected", visible: false, color: "#7C3AED", initials: "رو", date: "۱۴۰۴/۰۴/۱۸" },
];

const promoTypeInfo = {
  "نمایش در صفحه اصلی": {
    features: ["نمایش ویژه در صفحه اصلی سایت", "برچسب «پیشنهاد ویژه» روی فروشگاه", "اولویت در نتایج جستجو"],
    featured: true,
  },
  "بنر ویژه دسته‌بندی": {
    features: ["نمایش بنر در بالای صفحه دسته‌بندی", "دیده‌شدن بیشتر نزد مشتریان همان دسته", "گزارش کلیک اختصاصی بنر"],
    featured: false,
  },
  "نشان فروشگاه برتر": {
    features: ["نشان «فروشگاه برتر» کنار نام فروشگاه", "اولویت نمایش در لیست فروشگاه‌ها", "اعتماد بیشتر مشتریان"],
    featured: false,
  },
};

const initialThreads = [
  {
    id: "t1",
    name: "مریم صادقی",
    role: "بوتیک دیبا · فروشنده",
    color: "#BE185D",
    initials: "مص",
    unread: 2,
    messages: [
      { id: "m1", from: "user", text: "سلام، نمی‌تونم بنر فروشگاهم رو آپلود کنم، دسترسیش برام فعال نشده.", time: "۰۹:۱۲" },
      { id: "m2", from: "user", text: "میشه لطفاً بررسی کنید؟", time: "۰۹:۱۳" },
    ],
  },
  {
    id: "t2",
    name: "حسین کریمی",
    role: "کافه آرامش · فروشنده",
    color: "#2547E8",
    initials: "حک",
    unread: 1,
    messages: [
      { id: "m3", from: "user", text: "فروشگاهم هنوز تأیید نشده، چند روز طول می‌کشه؟", time: "دیروز" },
    ],
  },
  {
    id: "t3",
    name: "سارا محمدی",
    role: "کاربر عادی",
    color: "#5271FF",
    initials: "سم",
    unread: 0,
    messages: [
      { id: "m4", from: "user", text: "شماره تماس یکی از فروشگاه‌ها اشتباهه.", time: "۲ روز پیش" },
      { id: "m5", from: "admin", text: "ممنون از اطلاع‌رسانی، اصلاح شد ✅", time: "۲ روز پیش" },
    ],
  },
  {
    id: "t4",
    name: "رضا نوری",
    role: "خشکبار طلایی · فروشنده",
    color: "#FF9736",
    initials: "رن",
    unread: 3,
    messages: [
      { id: "m6", from: "user", text: "می‌خوام تبلیغ صفحه اصلی بخرم، هزینه‌اش چقدره؟", time: "۰۸:۴۰" },
    ],
  },
];

const initialFooterData = {
  brand: {
    description: "مرجع پیدا کردن کسب‌وکارهای محلی؛ از نانوایی محله تا دفتر وکالت، همراه با آدرس دقیق، اطلاعات کامل و نظرات واقعی کاربران.",
    social: { instagram: "#", telegram: "#", x: "#" },
  },
  columns: [
    { id: "col1", title: "لوکاوو", links: [
      { id: "l1", label: "درباره ما", content: "لوکاوو یک پلتفرم برای پیدا کردن کسب‌وکارهای محلی است." },
      { id: "l2", label: "فرصت‌های شغلی", content: "در حال حاضر فرصت شغلی باز اعلام‌نشده." },
      { id: "l3", label: "وبلاگ", content: "به‌زودی مقالات و اخبار لوکاوو اینجا منتشر می‌شه." },
      { id: "l4", label: "تماس با ما", content: "از فرم پشتیبانی یا شبکه‌های اجتماعی استفاده کن." },
    ]},
    { id: "col2", title: "برای کاربران", links: [
      { id: "l5", label: "راهنمای استفاده", content: "راهنمای کامل استفاده از لوکاوو." },
      { id: "l6", label: "سوالات متداول", content: "پرتکرارترین سوالات کاربران." },
      { id: "l7", label: "پشتیبانی", content: "تیم پشتیبانی لوکاوو." },
      { id: "l8", label: "قوانین و مقررات", content: "قوانین و مقررات پلتفرم." },
    ]},
    { id: "col3", title: "برای کسب‌وکارها", links: [
      { id: "l9", label: "ثبت کسب‌وکار", content: "از صفحه‌ی «افزودن کسب‌وکار» استفاده کن." },
      { id: "l10", label: "پنل فروشنده", content: "مدیریت اطلاعات، نظرات و نوبت‌دهی." },
      { id: "l11", label: "تعرفه‌ها", content: "تعرفه‌های ثبت کسب‌وکار." },
      { id: "l12", label: "راهنمای فروشندگان", content: "راهنمای گام‌به‌گام فروشندگان." },
    ]},
    { id: "col4", title: "دسترسی سریع", links: [
      { id: "l13", label: "دسته‌بندی‌ها", content: "همه‌ی دسته‌بندی‌ها." },
      { id: "l14", label: "نقشه شهر", content: "نقشه‌ی تعاملی کسب‌وکارها." },
      { id: "l15", label: "تازه‌ترین‌ها", content: "تازه‌ترین کسب‌وکارهای ثبت‌شده." },
      { id: "l16", label: "پرطرفدارها", content: "پرطرفدارترین کسب‌وکارها." },
    ]},
  ],
  bottomText: "© تمامی حقوق برای لوکاوو محفوظ است.",
  bottomMade: "ساخته شده با ❤ برای کسب‌وکارهای محلی",
};

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
  active: { label: "فعال", cls: "approved" },
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

function DashboardView({ sellers, onGoto, onSellerStatus }) {
  const pending = sellers.filter((s) => s.status === "pending");
  const active = sellers.filter((s) => s.status === "active");

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
          { icon: <IconUsers />, tint: "var(--primary-tint)", color: "var(--primary)", v: faNum(1240), l: "کل کاربران", t: "۸٫۲٪" },
          { icon: <IconStore />, tint: "color-mix(in srgb, var(--ok) 16%, transparent)", color: "var(--ok)", v: fa(active.length + 383), l: "فروشگاه فعال", t: "۴٫۱٪" },
          { icon: <IconCalendar />, tint: "color-mix(in srgb, var(--accent) 16%, transparent)", color: "var(--accent)", v: fa(pending.length), l: "در انتظار تأیید", t: "" },
          { icon: <IconClick />, tint: "#FCE9F1", color: "#BE185D", v: faNum(29400), l: "کل کلیک این ماه", t: "۱۲٪" },
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
              <button className="btn btn-approve" onClick={() => onSellerStatus(s.id, "active")}>
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
            { value: "active", label: "فعال", color: "var(--ok)" },
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
                        { value: "active", label: "فعال", color: "var(--ok)" },
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

function ClicksView() {
  const [range, setRange] = useState("today");
  const data = clickData[range] || [];

  return (
    <section className="view">
      <div className="section-head">
        <div>
          <h3>گزارش کلیک‌ها</h3>
          <div className="section-sub">مبنای صورتحساب فروشنده‌ها</div>
        </div>
        <RangePill
          value={range}
          onChange={setRange}
          options={[
            { value: "today", label: "امروز" },
            { value: "week", label: "این هفته" },
            { value: "month", label: "این ماه" },
          ]}
        />
      </div>

      <div className="stat-strip">
        <div className="card mini-stat">
          <div className="l">کل کلیک تلفن</div>
          <div className="v">{faNum(data.reduce((a, x) => a + x.phone, 0))}</div>
        </div>
        <div className="card mini-stat">
          <div className="l">کل کلیک موقعیت</div>
          <div className="v">{faNum(data.reduce((a, x) => a + x.location, 0))}</div>
        </div>
        <div className="card mini-stat">
          <div className="l">کل کلیک سایت</div>
          <div className="v">{faNum(data.reduce((a, x) => a + x.site, 0))}</div>
        </div>
        <div className="card mini-stat">
          <div className="l">مجموع</div>
          <div className="v">{faNum(data.reduce((a, x) => a + x.phone + x.location + x.site, 0))}</div>
        </div>
      </div>

      <div className="card table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>فروشگاه</th>
                <th>دسته</th>
                <th>تلفن</th>
                <th>موقعیت</th>
                <th>سایت</th>
                <th>مجموع</th>
              </tr>
            </thead>
            <tbody>
              {data.map((x) => (
                <tr key={x.id}>
                  <td>
                    <div className="biz-cell">
                      <div className="biz-logo" style={{ background: x.color }}>
                        {x.initials}
                      </div>
                      <div className="biz-name">{x.name}</div>
                    </div>
                  </td>
                  <td>
                    <span className="cat-tag">{x.category}</span>
                  </td>
                  <td>{faNum(x.phone)}</td>
                  <td>{faNum(x.location)}</td>
                  <td>{faNum(x.site)}</td>
                  <td>
                    <b>{faNum(x.phone + x.location + x.site)}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
      onEdit(editId, null, emoji, name.trim(), keyName);
      setEditId(null);
    } else {
      onAdd(null, emoji, name.trim(), keyName);
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
                    setKeyName(c.key_name || "other");
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
  const active = threads.find((t) => t.id === activeId) ?? threads[0];
  const list = threads.filter((t) => q.trim() === "" || t.name.includes(q.trim()) || t.role.includes(q.trim()));

  const send = () => {
    if (!text.trim()) return;
    onSend(active.id, text.trim());
    setText("");
  };

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
                <div className="t-prev">{t.messages[t.messages.length - 1]?.text}</div>
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
            {active.messages.map((m) => (
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
  const [toggles, setToggles] = useState({ registration: true, autoApprove: false, maintenance: false });

  return (
    <section className="view">
      <div className="settings-grid">
        <div className="card settings-card">
          <h4>بنر صفحه اصلی</h4>
          <div className="desc">تصویر بنری که در صفحه اصلی LOKAOO نمایش داده می‌شود</div>
          <div className="empty-state" style={{ padding: 24, border: "1.5px dashed var(--border)", borderRadius: 12, marginBottom: 14 }}>
            <IconImage />
            <div className="e-sub">آپلود تصویر بنر</div>
          </div>
          <button className="save-btn" onClick={() => onToast("تغییرات ذخیره شد", "ok")}>
            ذخیره
          </button>
        </div>
        <div className="card settings-card">
          <h4>تنظیمات عمومی</h4>
          <div className="desc">پیکربندی کلی رفتار پلتفرم</div>
          <div className="field-row">
            <label>نام سایت</label>
            <input defaultValue="LOKAOO" />
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
          <button className="save-btn" onClick={() => onToast("تنظیمات ذخیره شد", "ok")}>
            ذخیره تغییرات
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
              onClick={() => onToast("از پنل مدیریت خارج شدید", "no")}
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
        <div className="desc">کپی‌رایت و متن کوچک کنار آن</div>
        <div className="field-row">
          <label>متن کپی‌رایت</label>
          <input value={data.bottomText} onChange={(e) => updateBottom("bottomText", e.target.value)} />
        </div>
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

      <button className="save-btn" onClick={() => onToast("تغییرات فوتر ذخیره شد", "ok")}>
        ذخیره همه تغییرات
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
  const [sellers, setSellers] = useState(initialSellers);
  const [users, setUsers] = useState(initialUsers);
  const [categories, setCategories] = useState(initialCategories);
  const [products, setProducts] = useState(initialProducts);
  const [promos, setPromos] = useState(initialPromos);
  const [threads, setThreads] = useState(initialThreads);
  const [footerData, setFooterData] = useState(initialFooterData);
  const [activeThread, setActiveThread] = useState(initialThreads[0].id);
  const searchWrapRef = useRef(null);

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

  const setSellerStatus = (id, status) => {
    setSellers((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    showToast(
      status === "active" ? "فروشگاه تأیید شد" : status === "rejected" ? "درخواست رد شد" : "وضعیت فروشگاه تغییر کرد",
      status === "active" ? "ok" : "no",
    );
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
              <DashboardView sellers={sellers} onGoto={goto} onSellerStatus={setSellerStatus} />
            )}

            {view === "sellers" && (
              <SellersView
                sellers={sellers}
                categories={categories}
                onStatus={setSellerStatus}
                onBanner={(id) => {
                  setSellers((prev) => prev.map((s) => (s.id === id ? { ...s, banner: !s.banner } : s)));
                  showToast("دسترسی بنر تغییر کرد", "ok");
                }}
              />
            )}

            {view === "users" && (
              <UsersView
                users={users}
                onStatus={(id, status) => {
                  setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
                  showToast(status === "blocked" ? "کاربر مسدود شد" : "کاربر فعال شد", status === "blocked" ? "no" : "ok");
                }}
              />
            )}

            {view === "clicks" && <ClicksView />}

            {view === "promotions" && (
              <PromotionsView
                promos={promos}
                onStatus={(id, status) => {
                  setPromos((prev) => prev.map((p) => (p.id === id ? { ...p, status, visible: status === "active" } : p)));
                  showToast(status === "active" ? "تبلیغ تأیید شد" : status === "rejected" ? "تبلیغ رد شد" : "به صف بازگشت", status === "rejected" ? "no" : "ok");
                }}
                onVisible={(id) => setPromos((prev) => prev.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p)))}
              />
            )}

{view === "categories" && (
  <CategoriesView
    categories={categories}
    onAdd={(icon, emoji, name, key_name) => {
      setCategories((prev) => [
        ...prev,
        { id: uid(), icon, emoji, name, key_name: key_name || "other", count: 0 },
      ]);
      showToast("دسته‌بندی اضافه شد", "ok");
    }}
    onEdit={(id, icon, emoji, name, key_name) => {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, icon, emoji, name, key_name: key_name || c.key_name } : c
        )
      );
      showToast("دسته‌بندی ویرایش شد", "ok");
    }}
    onDelete={(id) => {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showToast("دسته‌بندی حذف شد", "no");
    }}
  />
)}

            {view === "products" && (
              <ProductsView
                products={products}
                sellers={sellers}
                categories={categories}
                onStatus={(id, status) => {
                  setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
                  showToast("وضعیت محصول تغییر کرد", status === "hidden" ? "no" : "ok");
                }}
                onDelete={(id) => {
                  setProducts((prev) => prev.filter((p) => p.id !== id));
                  showToast("محصول حذف شد", "no");
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
                }}
                onSend={(id, text) => {
                  const time = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
                  setThreads((prev) =>
                    prev.map((t) =>
                      t.id === id
                        ? { ...t, unread: 0, messages: [...t.messages, { id: uid(), from: "admin", text, time }] }
                        : t,
                    ),
                  );
                  showToast("پیام ارسال شد", "ok");
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