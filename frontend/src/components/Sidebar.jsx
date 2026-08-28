import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar({ items, activeNav, onNavClick, logoImg, logoAlt = "لوکاوو" }) {
  const location = useLocation();

  const isHashItem = (item) => item.path?.includes("#");

  const isHashActive = (item) => {
    if (!isHashItem(item)) return false;
    const hash = "#" + item.path.split("#")[1];
    return location.pathname === "/" && location.hash === hash;
  };

  // منطق دقیق تشخیص آیتم فعال:
  // - آیتم‌های هش‌دار (مثل «تازه‌ها») فقط وقتی فعال‌اند که هم مسیر «/» باشیم و هم همون هش
  // - آیتم «خانه» فقط وقتی فعاله که دقیقاً «/» باشیم و هیچ هشی هم نداشته باشیم
  //   (وگرنه چون «/» با پیشوند همه‌ی مسیرهای هش‌دار یکی می‌مونه، همیشه فعال نشون داده می‌شد)
  // - بقیه‌ی آیتم‌ها با «end» روی NavLink به‌صورت دقیق (نه پیشوندی) بررسی می‌شن
  // - «activeNav» فقط برای آیتم‌هایی که اصلاً مسیر ندارن (fallback) استفاده می‌شه
  const isItemActive = (item, routerActive) => {
    if (isHashItem(item)) return isHashActive(item);
    if (item.path === "/") return location.pathname === "/" && !location.hash;
    if (!item.path) return activeNav === item.key;
    return routerActive;
  };

  const handleClick = (item) => {
    onNavClick(item);
    if (isHashItem(item) && location.pathname === "/") {
      const id = item.path.split("#")[1];
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <aside className="sidebar">
      <div className="logo">
        <img src={logoImg} alt={logoAlt} className="logo-img" />
      </div>

      <nav className="nav">
        {items.map((item) => (
          <NavLink
            key={item.key}
            to={item.path || "/"}
            end
            className={({ isActive }) => (isItemActive(item, isActive) ? "active" : "")}
            onClick={() => handleClick(item)}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}