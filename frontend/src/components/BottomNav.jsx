import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./Sidebar.css";

export default function BottomNav({ items, activeNav, onNavClick }) {
  const location = useLocation();

  const isHashItem = (item) => item.path?.includes("#");

  const isHashActive = (item) => {
    if (!isHashItem(item)) return false;
    const hash = "#" + item.path.split("#")[1];
    return location.pathname === "/" && location.hash === hash;
  };

  // همون منطق دقیق Sidebar، تا حالت فعال بین سایدبار و بارِ پایین یکسان و درست بمونه
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
    <nav className="bottom-nav">
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
  );
}