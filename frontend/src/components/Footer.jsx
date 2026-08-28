import { useState, useEffect } from "react";
import "./Footer.css";

import logoBlack from "../assets/locavo-logo-black.png";
import logoWhite from "../assets/locavo-logo-white.png";

const FOOTER_COLS = [
  {
    title: "لوکاوو",
    links: ["درباره ما", "فرصت‌های شغلی", "وبلاگ", "تماس با ما"],
  },
  {
    title: "برای کاربران",
    links: [
      "راهنمای استفاده",
      "سوالات متداول",
      "پشتیبانی",
      "قوانین و مقررات",
    ],
  },
  {
    title: "برای کسب‌وکارها",
    links: [
      "ثبت کسب‌وکار",
      "پنل فروشنده",
      "تعرفه‌ها",
      "راهنمای فروشندگان",
    ],
  },
  {
    title: "دسترسی سریع",
    links: [
      "دسته‌بندی‌ها",
      "نقشه شهر",
      "تازه‌ترین‌ها",
      "پرطرفدارها",
    ],
  },
];

// متن پیش‌فرض هر پاپ‌آپ — هر کدوم رو می‌تونی جدا سفارشی کنی
const FOOTER_CONTENT = {
  "درباره ما": "لوکاوو یک پلتفرم برای پیدا کردن کسب‌وکارهای محلی است؛ از نانوایی محله تا دفتر وکالت.",
  "فرصت‌های شغلی": "در حال حاضر فرصت شغلی باز اعلام‌نشده. برای اطلاع از فرصت‌های آینده، بخش وبلاگ رو دنبال کن.",
  "وبلاگ": "به‌زودی مقالات و اخبار لوکاوو اینجا منتشر می‌شه.",
  "تماس با ما": "برای تماس با تیم لوکاوو می‌تونی از فرم پشتیبانی یا شبکه‌های اجتماعی استفاده کنی.",
  "راهنمای استفاده": "راهنمای کامل استفاده از لوکاوو به‌زودی اضافه می‌شه.",
  "سوالات متداول": "پرتکرارترین سوالات کاربران و پاسخشون به‌زودی اینجا قرار می‌گیره.",
  "پشتیبانی": "تیم پشتیبانی لوکاوو آماده‌ی پاسخگویی به سوالات شماست.",
  "قوانین و مقررات": "با استفاده از لوکاوو، قوانین و مقررات پلتفرم رو پذیرفته‌اید.",
  "ثبت کسب‌وکار": "برای ثبت کسب‌وکارت در لوکاوو، از صفحه‌ی «افزودن کسب‌وکار» استفاده کن.",
  "پنل فروشنده": "پنل فروشنده امکان مدیریت اطلاعات، نظرات و نوبت‌دهی رو در اختیارت می‌ذاره.",
  "تعرفه‌ها": "اطلاعات تعرفه‌های ثبت کسب‌وکار به‌زودی اینجا اعلام می‌شه.",
  "راهنمای فروشندگان": "راهنمای گام‌به‌گام برای فروشندگان تازه‌وارد به‌زودی منتشر می‌شه.",
  "دسته‌بندی‌ها": "همه‌ی دسته‌بندی‌های کسب‌وکارها رو از این بخش می‌تونی ببینی.",
  "نقشه شهر": "نقشه‌ی تعاملی کسب‌وکارهای شهر به‌زودی اضافه می‌شه.",
  "تازه‌ترین‌ها": "تازه‌ترین کسب‌وکارهای ثبت‌شده اینجا نمایش داده می‌شن.",
  "پرطرفدارها": "پرطرفدارترین کسب‌وکارها بر اساس نظر کاربران اینجا لیست می‌شن.",
};

function FooterModal({ title, onClose }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="footer-modal-backdrop" onClick={onClose}>
      <div
        className="footer-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="footer-modal-close" aria-label="بستن" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <h3>{title}</h3>
        <p>{FOOTER_CONTENT[title] || "اطلاعات این بخش به‌زودی تکمیل می‌شود."}</p>
      </div>
    </div>
  );
}

export default function Footer() {
  const [activeLink, setActiveLink] = useState(null);

  function openModal(e, link) {
    e.preventDefault();
    setActiveLink(link);
  }

  return (
    <footer className="site-footer">

      <div className="footer-top">

        {/* معرفی */}
        <div className="footer-brand">

          {/* لوگوی جدید */}
          <img
            src={logoBlack}
            alt="لوکاوو"
            className="footer-logo footer-logo-light"
          />
          <img
            src={logoWhite}
            alt="لوکاوو"
            className="footer-logo footer-logo-dark"
          />

          <div className="brand-content">

            <p>
              مرجع پیدا کردن کسب‌وکارهای محلی؛
              از نانوایی محله تا دفتر وکالت،
              همراه با آدرس دقیق، اطلاعات کامل
              و نظرات واقعی کاربران.
            </p>

            <div className="footer-social">

              <a href="#" aria-label="Instagram">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="5"
                  />
                  <circle cx="12" cy="12" r="4" />
                  <circle
                    cx="17.5"
                    cy="6.5"
                    r="1"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
              </a>

              <a href="#" aria-label="Telegram">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 4 3 11l6 2 2 6 3-4 5 3 2-14Z" />
                  <path d="M9 13l9-7" />
                </svg>
              </a>

              <a href="#" aria-label="X">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4L20 20" />
                  <path d="M20 4L4 20" />
                </svg>
              </a>

            </div>

          </div>

        </div>

        {/* ستون‌ها */}
        <div className="footer-cols">

          {FOOTER_COLS.map((col) => (

            <div className="footer-col" key={col.title}>

              <h4>{col.title}</h4>

              {col.links.map((link) => (
                <a href="#" key={link} onClick={(e) => openModal(e, link)}>
                  {link}
                </a>
              ))}

            </div>

          ))}

        </div>

      </div>

      {/* پایین فوتر */}
      <div className="footer-bottom">

        <span>
          © تمامی حقوق برای لوکاوو محفوظ است.
        </span>

        <span className="made">
          ساخته شده برای کسب‌و‌کارهای محلی
        </span>

      </div>

      {activeLink && (
        <FooterModal title={activeLink} onClose={() => setActiveLink(null)} />
      )}

    </footer>
  );
}