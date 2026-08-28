import React from "react";

export default function TopBar({
  logoImg,
  isLoggedIn,
  handleAuthToggle,
  query,
  setQuery,
  handleSearch,
  handleSearchKeyDown,
  selectedProvince,
  handleProvinceChange,
  ALL_PROVINCES,
  currentCities,
  selectedCity,
  setSelectedCity,
}) {
  return (
    <div className="topbar">
      <div className="topbar-head">
        <div className="logo">
          <img src={logoImg} alt="لوکاوو" className="logo-img" />
        </div>

        <div className="topbar-icons">
          <button className="icon-btn" aria-label="اعلان‌ها">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
          </button>

          <button className="icon-btn" onClick={handleAuthToggle}>
            {isLoggedIn ? "خروج" : "ورود"}
          </button>
        </div>
      </div>

      <div className="search-wrap">
        <input
          placeholder="جستجو در کسب‌وکارها..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
        <button className="search-btn" onClick={handleSearch}>جستجو</button>
      </div>

      <div className="location-selects">
        <select value={selectedProvince} onChange={handleProvinceChange}>
          {ALL_PROVINCES.map((prov) => (
            <option key={prov} value={prov}>{prov}</option>
          ))}
        </select>

        <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
          {currentCities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>
    </div>
  );
}