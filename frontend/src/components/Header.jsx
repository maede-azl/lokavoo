// Header.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const IRAN_LOCATIONS = [
  { province: "تهران", cities: ["تهران", "کرج", "اسلامشهر", "شهریار", "قدس", "ملارد", "پاکدشت", "ورامین"] },
  { province: "اصفهان", cities: ["اصفهان", "کاشان", "نجف‌آباد", "خمینی‌شهر", "شاهین‌شهر", "فلاورجان"] },
  { province: "خراسان رضوی", cities: ["مشهد", "نیشابور", "سبزوار", "تربت حیدریه", "قوچان"] },
  { province: "فارس", cities: ["شیراز", "مرودشت", "جهرم", "کازرون", "لار"] },
  { province: "آذربایجان شرقی", cities: ["تبریز", "مراغه", "مرند", "اهر", "میانه"] },
  { province: "آذربایجان غربی", cities: ["ارومیه", "خوی", "میاندوآب", "مهاباد"] },
  { province: "البرز", cities: ["کرج", "فردیس", "نظرآباد", "هشتگرد"] },
  { province: "مازندران", cities: ["ساری", "بابل", "آمل", "قائم‌شهر"] },
  { province: "گیلان", cities: ["رشت", "انزلی", "لاهیجان", "رودسر"] },
  { province: "خوزستان", cities: ["اهواز", "دزفول", "آبادان", "مسجدسلیمان"] },
  { province: "کرمانشاه", cities: ["کرمانشاه", "سنقر", "اسلام‌آباد غرب"] },
  { province: "لرستان", cities: ["خرم‌آباد", "بروجرد", "دورود"] },
  { province: "همدان", cities: ["همدان", "ملایر", "نهاوند"] },
  { province: "کردستان", cities: ["سنندج", "سقز", "مریوان"] },
  { province: "زنجان", cities: ["زنجان", "ابهر", "خرمدره"] },
  { province: "مرکزی", cities: ["اراک", "ساوه", "خمین"] },
  { province: "قزوین", cities: ["قزوین", "تاکستان", "بوئین‌زهرا"] },
  { province: "قم", cities: ["قم", "جعفریه", "کهک"] },
  { province: "سمنان", cities: ["سمنان", "شاهرود", "دامغان"] },
  { province: "یزد", cities: ["یزد", "میبد", "اردکان"] },
  { province: "هرمزگان", cities: ["بندرعباس", "میناب", "قشم"] },
  { province: "بوشهر", cities: ["بوشهر", "برازجان", "جم"] },
  { province: "چهارمحال بختیاری", cities: ["شهرکرد", "بروجن", "فارسان"] },
  { province: "کهگیلویه و بویراحمد", cities: ["یاسوج", "گچساران", "دوگنبدان"] },
  { province: "خراسان جنوبی", cities: ["بیرجند", "قاین", "نهبندان"] },
  { province: "خراسان شمالی", cities: ["بجنورد", "شیروان", "اسفراین"] },
  { province: "سیستان و بلوچستان", cities: ["زاهدان", "چابهار", "زابل"] },
  { province: "اردبیل", cities: ["اردبیل", "پارس‌آباد", "مشگین‌شهر"] },
  { province: "گلستان", cities: ["گرگان", "گنبدکاووس", "بندرترکمن"] },
  { province: "ایلام", cities: ["ایلام", "دهلران", "ایوان"] },
];

const ALL_PROVINCES = IRAN_LOCATIONS.map((item) => item.province);

export default function Header({
  logoImg,
  logoAlt = "لوکاوو",
  isLoggedIn,
  onAuthToggle,
  query,
  onQueryChange,
  onSearch,
  onSearchKeyDown,
  selectedProvince,
  selectedCity,
  onProvinceChange,
  onCityChange,
  theme = "light",
  onThemeToggle,
}) {
  const navigate = useNavigate();
  const currentCities = IRAN_LOCATIONS.find((p) => p.province === selectedProvince)?.cities || [];

  const handleProvinceSelect = (e) => {
    const newProvince = e.target.value;
    const firstCity = IRAN_LOCATIONS.find((p) => p.province === newProvince)?.cities[0] || "";
    onProvinceChange(newProvince, firstCity);
  };

  // کلیک روی آیکون نوتیفیکیشن → رفتن به صفحه‌ی پیام‌ها (برای هر دو نقش، همان MyChatsPage)
  const handleNotificationsClick = () => {
    if (!isLoggedIn) {
      onAuthToggle?.();
      return;
    }
    navigate("/my-chats");
  };

  return (
    <div className="topbar">
      <div className="topbar-head">
        <div className="logo">
          <img src={logoImg} alt={logoAlt} className="logo-img" />
        </div>

        <div className="topbar-icons">
          {/* دکمه تغییر تم */}
          <button
            className="icon-btn theme-toggle"
            onClick={onThemeToggle}
            title={theme === "light" ? "حالت شب" : "حالت روز"}
            aria-label="تغییر تم"
          >
            <svg
              className="icon-sun"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="4.2" />
              <path d="M12 2.5v2.4M12 19v2.5M4.2 4.2l1.7 1.7M18 18l1.7 1.7M2.5 12h2.4M19 12h2.5M4.2 19.8l1.7-1.7M18 6l1.7-1.7" />
            </svg>
            <svg
              className="icon-moon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 6.8 6.8 0 0 0 20 14.5Z" />
            </svg>
          </button>

          {isLoggedIn && (
            <button
              className="icon-btn"
              aria-label="پیام‌ها"
              title="پیام‌ها"
              onClick={handleNotificationsClick}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.7 21a2 2 0 0 1-3.4 0" />
              </svg>
            </button>
          )}

          {isLoggedIn ? (
            <div className="user-profile-wrapper" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                className="user-avatar"
                onClick={() => navigate("/profile")}
                role="button"
                tabIndex={0}
                aria-label="پروفایل من"
                title="پروفایل من"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate("/profile");
                  }
                }}
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #2547E8, #5271FF)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                </svg>
              </div>
              <button
                className="icon-btn logout-btn"
                onClick={onAuthToggle}
                title="خروج از حساب"
                style={{
                  background: "#E0344C15",
                  borderColor: "#E0344C",
                  color: "#E0344C",
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <path d="M10 17l5-5-5-5" />
                  <path d="M15 12H3" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              className="icon-btn"
              aria-label="ورود / حساب کاربری"
              onClick={onAuthToggle}
              title="ورود به حساب"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="search-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>

        <input
          placeholder="جستجو در کسب‌وکارها..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={onSearchKeyDown}
        />

        <button className="search-btn" onClick={onSearch}>
          جستجو
        </button>
      </div>

      <div className="location-selects">
        <div className="select-wrap">
          <select value={selectedProvince} onChange={handleProvinceSelect}>
            {ALL_PROVINCES.map((prov) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>
          <svg className="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>

        <div className="select-wrap">
          <select value={selectedCity} onChange={(e) => onCityChange(e.target.value)}>
            {currentCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <svg className="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
}