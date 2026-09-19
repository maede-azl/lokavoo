import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ReviewsPage.css";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import { getSidebarItems, getBottomNavItems, getSellerMenuItem } from "../components/navConfig";
import { useTheme } from "../context/ThemeContext";
import logoBlack from "../assets/locavo-logo-black.png";
import logoWhite from "../assets/locavo-logo-white.png";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const SUPPORT_EMAIL = "support@lokavo.ir";

const getAuthUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

// محتوای پیش‌فرض هر صفحه — تا زمانی که محتوای ویرایش‌شده توسط ادمین از سرور برسد
const DEFAULT_PAGES = {
  about: {
    title: "درباره ما",
    body: "لوکاوو مرجعی برای پیدا کردن کسب‌وکارهای محلی است؛ از نانوایی محله تا دفتر وکالت، همراه با آدرس دقیق، اطلاعات کامل و نظرات واقعی کاربران. هدف ما این است که پیدا کردن و انتخاب کسب‌وکارهای اطراف شما را ساده‌تر و مطمئن‌تر کنیم.",
  },
  contact: {
    title: "تماس با ما",
    body: `برای هرگونه سوال، پیشنهاد یا گزارش مشکل می‌توانید از طریق ایمیل ${SUPPORT_EMAIL} با تیم پشتیبانی لوکاوو در ارتباط باشید. اگر وارد حساب کاربری خود شده‌اید، از بخش «پروفایل > پشتیبانی» هم می‌توانید مستقیماً برای ما پیام بفرستید.`,
  },
  guide: {
    title: "راهنمای استفاده",
    body: "از صفحه‌ی اصلی می‌توانید بر اساس دسته‌بندی یا جستجو، کسب‌وکارهای اطراف خود را پیدا کنید. با ورود به صفحه‌ی هر کسب‌وکار، آدرس، شماره تماس، محصولات و نظرات کاربران دیگر را می‌بینید. برای ذخیره‌ی کسب‌وکارهای مورد علاقه از دکمه‌ی بوکمارک، و برای ثبت نظر از پایین صفحه‌ی همان کسب‌وکار استفاده کنید.",
  },
  faq: {
    title: "سوالات متداول",
    body: "برای ثبت کسب‌وکار باید ابتدا در اپ ثبت‌نام کنید و در مرحله‌ی ثبت‌نام گزینه‌ی «فروشنده» را انتخاب کنید، سپس از پنل فروشنده کسب‌وکار خود را اضافه کنید. کسب‌وکارهای تازه‌ثبت‌شده پس از بررسی و تایید مدیریت سایت در نتایج جستجو نمایش داده می‌شوند. برای هر مشکل دیگری هم می‌توانید از بخش تماس با ما با ما در ارتباط باشید.",
  },
  terms: {
    title: "قوانین و مقررات",
    body: "استفاده از لوکاوو به معنای پذیرفتن این تعهد است که اطلاعات ثبت‌شده (چه به عنوان کاربر و چه صاحب کسب‌وکار) صحیح و متعلق به خودتان باشد. انتشار نظرات توهین‌آمیز، تبلیغات نامرتبط یا اطلاعات نادرست درباره‌ی کسب‌وکارها مجاز نیست و ممکن است منجر به حذف محتوا یا مسدود شدن حساب شود.",
  },
  pricing: {
    title: "تعرفه‌ها",
    body: "ثبت کسب‌وکار در لوکاوو رایگان است. برای دیده‌شدن بیشتر، فروشنده‌ها می‌توانند از پنل فروشنده، بخش «رشد و تبلیغات»، یکی از طرح‌های تبلیغاتی زیر را درخواست بدهند:",
  },
  "seller-guide": {
    title: "راهنمای فروشندگان",
    body: "پس از تایید کسب‌وکار، از پنل فروشنده می‌توانید محصولات را اضافه کنید، به پیام‌های مشتریان پاسخ بدهید، نظرات ثبت‌شده را ببینید و به آن‌ها پاسخ بدهید، و آمار بازدید و تماس‌های کسب‌وکار خود را دنبال کنید. تکمیل کامل اطلاعات (آدرس دقیق، ساعات کاری، تصاویر باکیفیت) شانس دیده‌شدن شما را در جستجو بیشتر می‌کند.",
  },
};

export default function InfoPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const logoImg = theme === "dark" ? logoWhite : logoBlack;

  const [pageContent, setPageContent] = useState(DEFAULT_PAGES[slug] || null);
  const [promoTypes, setPromoTypes] = useState([]);
  const authUser = getAuthUser();
  const isLoggedIn = !!authUser;

  const sellerMenuItem = getSellerMenuItem(isLoggedIn, authUser, true);
  const SIDEBAR_NAV_ITEMS = getSidebarItems(sellerMenuItem, isLoggedIn);
  const BOTTOM_NAV_ITEMS = getBottomNavItems(sellerMenuItem, isLoggedIn);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/settings/footer`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json?.success && json.data?.pages?.[slug]) {
          setPageContent(json.data.pages[slug]);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (slug !== "pricing") return;
    fetch(`${API_BASE}/api/businesses/promo-types`)
      .then((res) => res.json())
      .then((json) => {
        if (json?.success) setPromoTypes(json.data || []);
      })
      .catch(() => {});
  }, [slug]);

  const content = pageContent || DEFAULT_PAGES[slug] || {
    title: "صفحه‌ی موردنظر پیدا نشد",
    body: "این صفحه هنوز محتوایی ندارد.",
  };

  return (
    <div className="rev-page lookavoo" dir="rtl">
      <div className="app-shell">
        <Sidebar items={SIDEBAR_NAV_ITEMS} activeNav="" onNavClick={() => {}} logoImg={logoImg} />
        <div className="main">
          <div className="rev-content">
            <div className="rev-header">
              <div className="rev-header-right">
                <img src={logoImg} alt="لوکاوو" className="rev-mobile-logo" />
                <button className="rev-icon-btn" onClick={() => navigate(-1)} title="بازگشت">
                  <BackIcon />
                </button>
                <div className="rev-title-wrap">
                  <h1 className="rev-title">{content.title}</h1>
                </div>
              </div>
            </div>

            <div className="rev-empty" style={{ textAlign: "start", alignItems: "flex-start" }}>
              <p style={{ lineHeight: 2, fontSize: 14, color: "var(--text)" }}>{content.body}</p>

              {slug === "pricing" && promoTypes.length > 0 && (
                <div style={{ width: "100%", display: "grid", gap: 12, marginTop: 16 }}>
                  {promoTypes.map((p) => (
                    <div
                      key={p.key}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        padding: "14px 16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{p.label}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          مدت نمایش: {p.days} روز
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: "nowrap" }}>
                        {p.price.toLocaleString("fa-IR")} تومان
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      <Footer />
      <BottomNav items={BOTTOM_NAV_ITEMS} activeNav="" onNavClick={(item) => item.path && navigate(item.path)} />
    </div>
  );
}
