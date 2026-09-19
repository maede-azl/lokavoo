import { useEffect, useRef, useState } from "react";
import "./Footer.css";

import logoBlack from "../assets/locavo-logo-black.png";
import logoWhite from "../assets/locavo-logo-white.png";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// محتوای پیش‌فرض — تا زمانی که پاسخ سرور برسد یا اگر سرور در دسترس نبود استفاده می‌شود
const DEFAULT_BRAND = {
  description:
    "مرجع پیدا کردن کسب‌وکارهای محلی؛ از نانوایی محله تا دفتر وکالت، همراه با آدرس دقیق، اطلاعات کامل و نظرات واقعی کاربران.",
  social: { instagram: "#", telegram: "#", x: "#" },
};

const DEFAULT_BOTTOM_MADE = "ساخته شده با ❤ برای کسب‌وکارهای محلی";

// ساختار پیش‌فرض فوتر. مقصدها دیگر به‌عنوان صفحه‌ی جدید باز نمی‌شوند؛
// محتوای هر مورد داخل یک پاپ‌آپ نمایش داده می‌شود.
const FOOTER_COLUMNS = [
  {
    id: "col1",
    title: "لوکاوو",
    links: [
      { label: "درباره ما", to: "/info/about", content: "لوکاوو مرجعی برای پیدا کردن کسب‌وکارهای محلی است؛ از نانوایی محله تا دفتر وکالت، همراه با آدرس دقیق، اطلاعات کامل و نظرات واقعی کاربران." },
      { label: "تماس با ما", to: "/info/contact", content: "برای هرگونه سؤال، پیشنهاد یا گزارش مشکل می‌توانید از طریق ایمیل support@lokavo.ir با تیم پشتیبانی لوکاوو در ارتباط باشید." },
    ],
  },
  {
    id: "col2",
    title: "برای کاربران",
    links: [
      { label: "راهنمای استفاده", to: "/info/guide", content: "از صفحه‌ی اصلی می‌توانید بر اساس دسته‌بندی یا جستجو، کسب‌وکارهای اطراف خود را پیدا کنید." },
      { label: "سوالات متداول", to: "/info/faq", content: "برای ثبت کسب‌وکار باید ابتدا در اپ به‌عنوان فروشنده ثبت‌نام کنید، سپس از پنل فروشنده کسب‌وکار خود را اضافه کنید." },
      { label: "پشتیبانی", to: "/info/contact", content: "برای دریافت پشتیبانی، مشکل یا پیشنهاد خود را از طریق بخش پشتیبانی حساب کاربری ارسال کنید." },
      { label: "قوانین و مقررات", to: "/info/terms", content: "استفاده از لوکاوو به معنای پذیرفتن این تعهد است که اطلاعات ثبت‌شده صحیح و متعلق به خودتان باشد." },
    ],
  },
  {
    id: "col3",
    title: "برای کسب‌وکارها",
    links: [
      { label: "ثبت کسب‌وکار", to: "/add-business", content: "با انتخاب این گزینه، راهنمای کوتاه ثبت کسب‌وکار در لوکاوو نمایش داده می‌شود. برای ثبت واقعی کسب‌وکار می‌توانید از فرم «ثبت کسب‌وکار» در حساب فروشنده استفاده کنید." },
      { label: "پنل فروشنده", to: "/seller/dashboard", content: "پنل فروشنده برای مدیریت کسب‌وکار، محصولات، پیام‌ها، نظرات و گزارش‌های عملکرد استفاده می‌شود." },
      { label: "تعرفه‌ها", to: "/info/pricing", content: "ثبت کسب‌وکار در لوکاوو رایگان است. برای دیده‌شدن بیشتر می‌توانید از طرح‌های تبلیغاتی و خدمات ویژه استفاده کنید." },
      { label: "راهنمای فروشندگان", to: "/info/seller-guide", content: "پس از تأیید کسب‌وکار، از پنل فروشنده می‌توانید محصولات را اضافه کنید و به پیام‌ها و نظرات مشتریان پاسخ بدهید." },
    ],
  },
  {
    id: "col4",
    title: "دسترسی سریع",
    links: [
      { label: "دسته‌بندی‌ها", to: "/categories", content: "از این بخش می‌توانید دسته‌بندی‌های مختلف کسب‌وکارها را مرور کنید و دسته‌بندی موردنظر خود را برای جستجو انتخاب کنید." },
      { label: "تازه‌ترین‌ها", to: "/search?sort=new", content: "این بخش برای دسترسی سریع به تازه‌ترین کسب‌وکارهای ثبت‌شده طراحی شده است." },
      { label: "پرطرفدارها", to: "/search?sort=rating", content: "این بخش برای مشاهده کسب‌وکارهای محبوب و پربازدید طراحی شده است." },
    ],
  },
];

function slugFromPath(to) {
  const match = String(to || "").match(/^\/info\/([^/?#]+)/);
  return match ? match[1] : null;
}

export default function Footer() {
  const [brand, setBrand] = useState(DEFAULT_BRAND);
  const [bottomMade, setBottomMade] = useState(DEFAULT_BOTTOM_MADE);
  const [columns, setColumns] = useState(FOOTER_COLUMNS);
  const [activeLink, setActiveLink] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/settings/footer`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json?.success && json.data) {
          if (json.data.brand) setBrand({ ...DEFAULT_BRAND, ...json.data.brand, social: { ...DEFAULT_BRAND.social, ...(json.data.brand.social || {}) } });
          if (json.data.bottomMade) setBottomMade(json.data.bottomMade);
          if (Array.isArray(json.data.columns) && json.data.columns.length) {
            setColumns(
              json.data.columns.map((col) => ({
                ...col,
                links: Array.isArray(col.links) ? col.links : [],
              }))
            );
          }
          if (json.data.pages) {
            setColumns((prev) => prev.map((col) => ({
              ...col,
              links: col.links.map((link) => {
                const slug = slugFromPath(link.to);
                const page = slug ? json.data.pages?.[slug] : null;
                return page?.body && !link.content ? { ...link, content: page.body, pageTitle: page.title } : { ...link, pageTitle: page?.title || link.pageTitle };
              }),
            })));
          }
        }
      })
      .catch(() => {})
      .finally(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!activeLink) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setActiveLink(null);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [activeLink]);

  const social = brand.social || {};
  const openLink = (link) => {
    setActiveLink({
      title: link.pageTitle || link.label,
      content: String(link.content || "").trim() || "اطلاعات این بخش در حال تکمیل است.",
    });
  };

  return (
    <>
      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <img src={logoBlack} alt="لوکاوو" className="footer-logo footer-logo-light" />
            <img src={logoWhite} alt="لوکاوو" className="footer-logo footer-logo-dark" />
            <div className="brand-content">
              <p>{brand.description || DEFAULT_BRAND.description}</p>
              <div className="footer-social">
                <a href={social.instagram || "#"} target="_blank" rel="noreferrer" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
                </a>
                <a href={social.telegram || "#"} target="_blank" rel="noreferrer" aria-label="Telegram">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 4 3 11l6 2 2 6 3-4 5 3 2-14Z" /><path d="M9 13l9-7" /></svg>
                </a>
                <a href={social.x || "#"} target="_blank" rel="noreferrer" aria-label="X">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4L20 20" /><path d="M20 4L4 20" /></svg>
                </a>
              </div>
            </div>
          </div>

          <div className="footer-cols">
            {columns.map((col) => (
              <div className="footer-col" key={col.id || col.title}>
                <h4>{col.title}</h4>
                {(col.links || []).map((link) => (
                  <button type="button" className="footer-link-button" onClick={() => openLink(link)} key={link.id || link.label}>
                    {link.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="footer-bottom">
          <span className="made">{bottomMade || DEFAULT_BOTTOM_MADE}</span>
        </div>
      </footer>

      {activeLink && (
        <div className="footer-modal-backdrop" role="presentation" onMouseDown={() => setActiveLink(null)}>
          <div
            className="footer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="footer-modal-title"
            ref={modalRef}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button type="button" className="footer-modal-close" onClick={() => setActiveLink(null)} aria-label="بستن">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            <h3 id="footer-modal-title">{activeLink.title}</h3>
            <p>{activeLink.content}</p>
          </div>
        </div>
      )}
    </>
  );
}

