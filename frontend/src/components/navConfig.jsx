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
    path: "/#latest-shops",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
      </svg>
    ),
  },
  {
    key: "favorites",
    label: "ذخیره‌شده",
    path: "/favorites",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
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

export const ADMIN_PANEL_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2 4 6v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export function getSellerMenuItem(isLoggedIn, authUser, hasOwnBusiness) {
  if (!isLoggedIn) {
    return {
      key: "add-business",
      label: "افزودن کسب‌وکار",
      path: "/auth",
      icon: ADD_BUSINESS_ICON,
    };
  }

  if (authUser?.role === "admin") {
    return {
      key: "admin",
      label: "پنل ادمین",
      path: "/admin",
      icon: ADMIN_PANEL_ICON,
    };
  }

  if (authUser?.role === "user") return null;

  if (authUser?.role === "seller") {
    if (hasOwnBusiness) {
      return {
        key: "seller",
        label: "پنل فروشنده",
        path: "/seller/dashboard",
        icon: SELLER_PANEL_ICON,
      };
    }

    return {
      key: "add-business",
      label: "افزودن کسب‌وکار",
      path: "/add-business",
      icon: ADD_BUSINESS_ICON,
    };
  }

  return null;
}
// لیست آیتم‌های منوی سایدبار (نسخه دسکتاپ/لپ‌تاپ)
export function getSidebarItems(sellerMenuItem, isLoggedIn = true) {
  const [home, categories, latest, favorites] = NAV_ITEMS;

  const base = sellerMenuItem
    ? [home, categories, sellerMenuItem, latest, favorites]
    : [home, categories, latest, favorites];

  return isLoggedIn ? base : base.filter((item) => item.key !== "favorites");
}

// لیست آیتم‌های منوی پایین صفحه (نسخه موبایل)
export function getBottomNavItems(sellerMenuItem, isLoggedIn = true) {
  const [home, categories, latest, favorites] = NAV_ITEMS;

  const base = sellerMenuItem
    ? [home, categories, sellerMenuItem, favorites, latest]
    : [home, categories, favorites, latest];

  return isLoggedIn ? base : base.filter((item) => item.key !== "favorites");
}