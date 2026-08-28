import React from "react";

export const NAV_ITEMS = [
  {
    key: "home",
    label: "خانه",
    path: "/",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    key: "categories",
    label: "دسته‌بندی‌ها",
    path: "/categories",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    key: "new",
    label: "تازه‌ها",
    path: "/search?sort=new",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
      </svg>
    ),
  },
  {
    key: "favorites",
    label: "علاقه‌مندی‌ها",
    path: "/favorites",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
    ),
  },
  {
    key: "reviews",
    label: "نظرات من",
    path: "/reviews",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4A8.4 8.4 0 1 1 21 11.5Z" />
        <path d="M8 10h8M8 14h5" />
      </svg>
    ),
  },
];

export const SELLER_PANEL_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l1-5h16l1 5" />
    <path d="M4 9v10h16V9" />
    <path d="M9 21v-6h6v6" />
  </svg>
);

export const ADD_BUSINESS_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l1-5h16l1 5" />
    <path d="M4 9v10h16V9" />
    <path d="M12 12v6M9 15h6" />
  </svg>
);