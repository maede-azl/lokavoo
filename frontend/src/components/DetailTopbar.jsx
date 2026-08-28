import React from "react";
import "./DetailTopbar.css";

/**
 * هدر جدا شده از صفحه جزئیات کسب‌وکار
 * شامل: دکمه بازگشت، breadcrumb، دکمه سیو (بوکمارک)، دکمه تغییر حالت شب/روز و دکمه اشتراک‌گذاری
 *
 * Props:
 * - onBack: تابعی که با کلیک روی دکمه بازگشت اجرا می‌شود (مثلاً () => navigate(-1))
 * - crumbCategory: متن دسته‌بندی در breadcrumb (مثلاً business.category?.name)
 * - crumbTitle: متن عنوان اصلی در breadcrumb (مثلاً business.name)
 * - mode: "light" | "dark"
 * - onToggleMode: تابع تغییر حالت شب/روز
 * - savedActive: boolean برای استایل فعال دکمه سیو (اختیاری)
 * - onToggleSave: تابع کلیک روی دکمه سیو (بوکمارک)
 * - shareActive: boolean برای استایل فعال دکمه اشتراک‌گذاری (اختیاری)
 * - onToggleShare: تابع کلیک روی دکمه اشتراک‌گذاری
 */
export default function DetailTopbar({
  onBack,
  crumbCategory,
  crumbTitle,
  mode,
  onToggleMode,
  savedActive = false,
  onToggleSave,
  shareActive = false,
  onToggleShare,
}) {
  return (
    <div className="bdp-topbar">
      <button className="bdp-back-btn" onClick={onBack}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        بازگشت
      </button>

      <div className="bdp-crumbs">
        {crumbCategory} <span className="sep">/</span> <b>{crumbTitle}</b>
      </div>

      <button
        className="bdp-icon-btn theme-toggle-btn"
        onClick={onToggleMode}
        title="تغییر به حالت شب/روز"
      >
        {mode === "light" ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.5v2.4M12 19v2.5M4.2 4.2l1.7 1.7M18 18l1.7 1.7M2.5 12h2.4M19 12h2.5M4.2 19.8l1.7-1.7M18 6l1.7-1.7" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 6.8 6.8 0 0 0 20 14.5Z" />
          </svg>
        )}
      </button>

      <button
        className={`bdp-icon-btn ${savedActive ? "is-active" : ""}`}
        onClick={onToggleSave}
        title="ذخیره"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 4h12v17l-6-4-6 4V4Z" />
        </svg>
      </button>

      <button
        className={`bdp-icon-btn ${shareActive ? "saved" : ""}`}
        onClick={onToggleShare}
        title="اشتراک‌گذاری"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="6" cy="12" r="2.2" />
          <circle cx="18" cy="6" r="2.2" />
          <circle cx="18" cy="18" r="2.2" />
          <path d="M8 11l8-4M8 13l8 4" />
        </svg>
      </button>
    </div>
  );
}